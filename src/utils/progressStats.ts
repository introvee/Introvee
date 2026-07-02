import type { UserDareLog } from '../types/dare';
import type { Profile } from '../types/profile';

const totalJourneyDares = 100;
const stagesPerLevel = 5;

export function getCompletedDaresFromProgress(profile: Profile, completedDareCount = 0, todaysLog?: UserDareLog | null) {
  const profileStageCount = (profile.current_level - 1) * stagesPerLevel + Math.max(profile.current_stage - 1, 0);
  const profileDayCount = Math.max(profile.current_day - 1, 0);
  const finalStageCompleted =
    profile.current_level === 20 &&
    profile.current_stage === stagesPerLevel &&
    (todaysLog?.status === 'completed' || todaysLog?.status === 'easier_completed');

  return clamp(
    Math.max(completedDareCount, profileStageCount, profileDayCount, finalStageCompleted ? totalJourneyDares : 0),
    0,
    totalJourneyDares
  );
}

export function getConfidencePercent(completedDares: number) {
  return clamp(Math.round((completedDares / totalJourneyDares) * 100), 0, 100);
}

export function getCompletedStagesInCurrentLevel(completedDares: number, currentLevel: number) {
  return clamp(completedDares - (currentLevel - 1) * stagesPerLevel, 0, stagesPerLevel);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
