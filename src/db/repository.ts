import { copy } from '../constants/copy';
import { supabase } from '../lib/supabase';
import type { Dare, UserDareLog } from '../types/dare';
import type { OnboardingInput, Profile } from '../types/profile';
import { nextProgress, STAGE_BONUS_POINTS } from '../utils/points';
import { makeId } from './ids';

const DARE_SELECT_COLUMNS = [
  'id',
  'level',
  'stage',
  'day_number',
  'life_category',
  'title',
  'description',
  'easier_title',
  'easier_description',
  'safety_tip',
  'difficulty',
  'points',
  'mascot_type',
  'created_at'
].join(', ');

export type CompleteDareResult = {
  profile: Profile;
  basePoints: number;
  timingBonus: number;
  levelBonus: number;
  alreadyDone: boolean;
};

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : null;
}

export async function saveOnboardingProfile(userId: string, input: OnboardingInput) {
  const existing = await getProfile(userId);
  const now = new Date().toISOString();
  const avatarUrl = input.avatar_uri ? await uploadProfileAvatar(userId, input.avatar_uri) : input.avatar_url ?? existing?.avatar_url ?? null;
  const payload = {
    id: userId,
    name: input.name,
    age: input.age,
    dob: input.dob,
    gender: input.gender,
    life_category: input.life_category,
    avatar_url: avatarUrl,
    onboarding_completed: true,
    current_level: existing?.current_level ?? 1,
    current_stage: existing?.current_stage ?? 1,
    current_day: existing?.current_day ?? 1,
    total_points: existing?.total_points ?? 0,
    streak_count: existing?.streak_count ?? 0,
    created_at: existing?.created_at ?? now,
    updated_at: now
  };

  const { data, error } = await supabase.from('profiles').upsert(payload).select('*').single();
  if (error) throw error;
  return mapProfile(data);
}

async function uploadProfileAvatar(userId: string, imageUri: string) {
  const response = await fetch(imageUri);
  if (!response.ok) throw new Error('Could not read the selected profile image.');

  const imageData = await response.arrayBuffer();
  const storagePath = `${userId}/avatar-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('profile-images').upload(storagePath, imageData, {
    contentType: 'image/jpeg',
    upsert: true
  });

  if (error) throw error;

  const { data } = supabase.storage.from('profile-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function updateProfileDetails(userId: string, input: Partial<Profile> & { avatar_uri?: string }) {
  let avatarUrl = input.avatar_url;
  if (input.avatar_uri) {
    avatarUrl = await uploadProfileAvatar(userId, input.avatar_uri);
  }

  const payload = removeUndefined({
    name: input.name,
    age: input.age,
    dob: input.dob,
    gender: input.gender,
    life_category: input.life_category,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString()
  });

  const { data, error } = await supabase.from('profiles').update(payload).eq('id', userId).select('*').single();
  if (error) throw error;
  return mapProfile(data);
}

export async function updateProfileProgress(userId: string, updates: Partial<Profile>) {
  const payload = removeUndefined({
    current_level: updates.current_level,
    current_stage: updates.current_stage,
    current_day: updates.current_day,
    total_points: updates.total_points,
    streak_count: updates.streak_count,
    updated_at: new Date().toISOString()
  });

  const { data, error } = await supabase.from('profiles').update(payload).eq('id', userId).select('*').single();
  if (error) throw error;
  return mapProfile(data);
}

export async function getTodayDare(profile: Profile) {
  const match = await findDare(profile.life_category, profile.current_day);
  if (match) return match;
  return null;
}

export async function getLevelDares(profile: Profile) {
  const matches = await findDaresForLevel(profile.life_category, profile.current_level);
  if (matches.length > 0) return matches;
  return findDaresForLevel('General Adult', profile.current_level);
}

export async function getTodaysDareLog(userId: string): Promise<UserDareLog | null> {
  const { start, end } = getLocalDayRange();
  const { data, error } = await supabase
    .from('user_dare_logs')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['completed', 'easier_completed', 'skipped'])
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapLog(data) : null;
}

export async function awardPoints(
  userId: string,
  points: number,
  type: string,
  metadata: any = {},
  levelNumber: number | null = null,
  stageNumber: number | null = null,
  dareId: string | null = null
): Promise<{ pointsAwarded: number; profile: Profile | null }> {
  const { data, error } = await supabase.rpc('award_points', {
    p_user_id: userId,
    p_points: points,
    p_type: type,
    p_metadata: metadata,
    p_level_number: levelNumber,
    p_stage_number: stageNumber,
    p_dare_id: dareId
  });

  if (error) {
    console.error('Error awarding points:', error);
    return { pointsAwarded: 0, profile: null };
  }

  const pointsAwarded = data as number;
  if (pointsAwarded > 0) {
    const updatedProfile = await getProfile(userId);
    return { pointsAwarded, profile: updatedProfile };
  }

  return { pointsAwarded: 0, profile: null };
}

export async function awardSharePoints(userId: string, dareId: string | null, isAppShare = false): Promise<{ pointsAwarded: number; profile: Profile | null }> {
  if (isAppShare) {
    return awardPoints(userId, 40, 'app_shared');
  } else if (dareId) {
    return awardPoints(userId, 25, 'dare_shared', {}, null, null, dareId);
  }
  return { pointsAwarded: 0, profile: null };
}

export async function completeDare(userId: string, profile: Profile, dare: Dare, easier = false, elapsedSeconds = 0): Promise<CompleteDareResult> {
  const todaysLog = await getTodaysDareLog(userId);
  if (todaysLog) {
    return { profile, basePoints: 0, timingBonus: 0, levelBonus: 0, alreadyDone: true };
  }

  const progress = nextProgress(profile.current_level, profile.current_stage);
  
  // Award points sequentially
  const { pointsAwarded: basePoints } = await awardPoints(userId, 50, 'stage_completed', {}, profile.current_level, profile.current_stage);
  
  let timingBonus = 5;
  if (elapsedSeconds <= 60) timingBonus = 30;
  else if (elapsedSeconds <= 180) timingBonus = 20;
  else if (elapsedSeconds <= 300) timingBonus = 10;
  
  const { pointsAwarded: actualTimingBonus } = await awardPoints(userId, timingBonus, 'timing_bonus', {}, null, null, dare.id);
  
  let levelBonus = 0;
  if (progress.completedLevel) {
    const { pointsAwarded: actualLevelBonus } = await awardPoints(userId, 150, 'level_completed', {}, profile.current_level);
    levelBonus = actualLevelBonus;
  }

  const totalEarned = basePoints + actualTimingBonus + levelBonus;
  const now = new Date().toISOString();

  const { error: logError } = await supabase.from('user_dare_logs').insert({
    id: makeId('log'),
    user_id: userId,
    dare_id: dare.id,
    status: easier ? 'easier_completed' : 'completed',
    completed_type: easier ? 'easier' : dare.difficulty,
    points_earned: totalEarned,
    completed_at: now,
    skipped_at: null,
    reflection: '',
    photo_url: null,
    created_at: now
  });
  if (logError) throw logError;

  const updatedProfile = await updateProfileProgress(userId, {
    current_level: progress.level,
    current_stage: progress.stage,
    current_day: Math.min(profile.current_day + 1, 100),
    streak_count: profile.streak_count + 1
  });

  return { profile: updatedProfile, basePoints, timingBonus: actualTimingBonus, levelBonus, alreadyDone: false };
}

export async function skipDare(userId: string, dare: Dare): Promise<string> {
  const todaysLog = await getTodaysDareLog(userId);
  if (todaysLog) return copy.todaySkipped;

  const now = new Date().toISOString();
  const { error } = await supabase.from('user_dare_logs').insert({
    id: makeId('log'),
    user_id: userId,
    dare_id: dare.id,
    status: 'skipped',
    points_earned: 0,
    completed_type: null,
    reflection: null,
    photo_url: null,
    completed_at: null,
    skipped_at: now,
    created_at: now
  });
  if (error) throw error;
  return copy.skipped;
}

export async function getJournal(userId: string) {
  const { data, error } = await supabase
    .from('user_dare_logs')
    .select('*, dares(title, description)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapLog);
}

export async function getCompletedDareCount(userId: string) {
  const { count, error } = await supabase
    .from('user_dare_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['completed', 'easier_completed']);

  if (error) throw error;
  return count ?? 0;
}

export async function getBadgeCount(userId: string) {
  const { count, error } = await supabase.from('user_badges').select('id', { count: 'exact', head: true }).eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}

async function findDare(lifeCategory: string, dayNumber: number) {
  const { data, error } = await supabase
    .from('dares')
    .select(DARE_SELECT_COLUMNS)
    .eq('life_category', lifeCategory)
    .eq('day_number', dayNumber)
    .maybeSingle();

  if (error) throw error;
  return data ? mapDare(data) : null;
}

async function findDaresForLevel(lifeCategory: string, level: number) {
  const { data, error } = await supabase
    .from('dares')
    .select(DARE_SELECT_COLUMNS)
    .eq('life_category', lifeCategory)
    .eq('level', level)
    .order('stage', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapDare);
}

function mapProfile(row: Record<string, any>): Profile {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    dob: row.dob ?? null,
    gender: row.gender,
    life_category: row.life_category,
    avatar_url: row.avatar_url ?? null,
    onboarding_completed: row.onboarding_completed,
    current_level: row.current_level,
    current_stage: row.current_stage,
    current_day: row.current_day,
    total_points: row.total_points,
    streak_count: row.streak_count,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function mapDare(row: Record<string, any>): Dare {
  return {
    id: row.id,
    level: row.level,
    stage: row.stage,
    day_number: row.day_number,
    life_category: row.life_category,
    title: row.title,
    description: row.description,
    easier_title: row.easier_title,
    easier_description: row.easier_description,
    safety_tip: row.safety_tip,
    difficulty: row.difficulty,
    points: row.points,
    mascot_type: row.mascot_type,
    created_at: row.created_at
  };
}

function mapLog(row: Record<string, any>): UserDareLog {
  return {
    id: row.id,
    user_id: row.user_id,
    dare_id: row.dare_id,
    status: row.status,
    completed_type: row.completed_type,
    points_earned: row.points_earned,
    reflection: row.reflection,
    photo_url: row.photo_url,
    completed_at: row.completed_at,
    skipped_at: row.skipped_at,
    created_at: row.created_at,
    dares: row.dares ? { title: row.dares.title, description: row.dares.description } : null
  };
}

function removeUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function getLocalDayRange() {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
}
