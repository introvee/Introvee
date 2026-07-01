import {
  completeDare as completeDareRepository,
  getCompletedDareCount as getCompletedDareCountRepository,
  getJournal as getJournalRepository,
  getLevelDares as getLevelDaresRepository,
  getTodayDare as getTodayDareRepository,
  getTodaysDareLog as getTodaysDareLogRepository,
  skipDare as skipDareRepository
} from '../db/repository';
import type { Dare, UserDareLog } from '../types/dare';
import type { Profile } from '../types/profile';

const devBypassUserId = '00000000-0000-4000-8000-000000000001';

export type CompleteDareResult = {
  profile: Profile;
  basePoints: number;
  timingBonus: number;
  levelBonus: number;
  alreadyDone: boolean;
};

export function getTodayDare(profile: Profile): Promise<Dare | null> {
  if (profile.id === devBypassUserId) {
    return Promise.resolve(getDevDare(profile));
  }

  return getTodayDareRepository(profile);
}

export function getLevelDares(profile: Profile): Promise<Dare[]> {
  if (profile.id === devBypassUserId) {
    return Promise.resolve([getDevDare(profile)]);
  }

  return getLevelDaresRepository(profile);
}

export function getTodaysDareLog(userId: string): Promise<UserDareLog | null> {
  if (userId === devBypassUserId) {
    return Promise.resolve(null);
  }

  return getTodaysDareLogRepository(userId);
}

export function completeDare(userId: string, profile: Profile, dare: Dare, easier = false, elapsedSeconds = 0): Promise<CompleteDareResult> {
  if (userId === devBypassUserId) {
    return Promise.resolve(completeDevDare(profile));
  }

  return completeDareRepository(userId, profile, dare, easier, elapsedSeconds);
}

export function skipDare(userId: string, dare: Dare): Promise<string> {
  if (userId === devBypassUserId) {
    return Promise.resolve('Skipped for local testing.');
  }

  return skipDareRepository(userId, dare);
}

export function getJournal(userId: string): Promise<UserDareLog[]> {
  if (userId === devBypassUserId) {
    return Promise.resolve([]);
  }

  return getJournalRepository(userId);
}

export function getCompletedDareCount(userId: string): Promise<number> {
  if (userId === devBypassUserId) {
    return Promise.resolve(0);
  }

  return getCompletedDareCountRepository(userId);
}

function getDevDare(profile: Profile): Dare {
  return {
    id: `dev-dare-day-${profile.current_day}`,
    level: profile.current_level,
    stage: profile.current_stage,
    day_number: profile.current_day,
    life_category: profile.life_category,
    title: 'Ask one simple question today.',
    description: 'Choose one low-pressure moment and ask a short, friendly question. Keep it simple and easy to leave.',
    easier_title: 'Send a short polite message instead.',
    easier_description: 'A smaller step still counts. Send one simple question by text or chat.',
    safety_tip: 'Stay respectful, keep personal boundaries, and skip anything that feels unsafe.',
    difficulty: 'easy',
    points: 50,
    mascot_type: null,
    created_at: new Date().toISOString()
  };
}

function completeDevDare(profile: Profile): CompleteDareResult {
  return {
    profile: {
      ...profile,
      current_stage: profile.current_stage >= 5 ? 1 : profile.current_stage + 1,
      current_level: profile.current_stage >= 5 ? Math.min(profile.current_level + 1, 20) : profile.current_level,
      current_day: Math.min(profile.current_day + 1, 100),
      total_points: profile.total_points + 50,
      streak_count: profile.streak_count + 1,
      updated_at: new Date().toISOString()
    },
    basePoints: 50,
    timingBonus: 0,
    levelBonus: 0,
    alreadyDone: false
  };
}
