import type { DareDifficulty } from '../types/dare';

export const pointsByDifficulty: Record<DareDifficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 35
};

export const STAGE_BONUS_POINTS = 50;
export const REFLECTION_POINTS = 5;
export const PHOTO_POINTS = 5;
export const SHARE_POINTS = 10;

export function nextProgress(level: number, stage: number) {
  if (level >= 20 && stage >= 5) {
    return { level: 20, stage: 5, completedLevel: false };
  }

  if (stage >= 5) {
    return { level: Math.min(level + 1, 20), stage: 1, completedLevel: true };
  }

  return { level, stage: stage + 1, completedLevel: false };
}
