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

export type CompleteDareResult = {
  profile: Profile;
  basePoints: number;
  timingBonus: number;
  levelBonus: number;
  alreadyDone: boolean;
};

export function getTodayDare(profile: Profile): Promise<Dare | null> {
  return getTodayDareRepository(profile);
}

export function getLevelDares(profile: Profile): Promise<Dare[]> {
  return getLevelDaresRepository(profile);
}

export function getTodaysDareLog(userId: string): Promise<UserDareLog | null> {
  return getTodaysDareLogRepository(userId);
}

export function completeDare(userId: string, profile: Profile, dare: Dare, easier = false, elapsedSeconds = 0): Promise<CompleteDareResult> {
  return completeDareRepository(userId, profile, dare, easier, elapsedSeconds);
}

export function skipDare(userId: string, dare: Dare): Promise<string> {
  return skipDareRepository(userId, dare);
}

export function getJournal(userId: string): Promise<UserDareLog[]> {
  return getJournalRepository(userId);
}

export function getCompletedDareCount(userId: string): Promise<number> {
  return getCompletedDareCountRepository(userId);
}
