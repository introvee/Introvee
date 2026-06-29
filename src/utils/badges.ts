import type { Profile } from '../types/profile';

export function candidateBadgeNames(profile: Profile) {
  const badges: string[] = [];
  if (profile.current_day >= 2) badges.push('First Step');
  if (profile.streak_count >= 5) badges.push('Five-Day Flame');
  if (profile.current_level >= 5) badges.push('Level 5 Listener');
  if (profile.total_points >= 500) badges.push('Quiet Courage');
  return badges;
}
