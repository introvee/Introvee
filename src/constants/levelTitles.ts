export const LEVEL_TITLE_FALLBACK = 'Social Journey';

export const LEVEL_TITLES: Record<number, string> = {
  1: 'First Hello',
  2: 'Friendly Spark',
  3: 'Simple Introductions',
  4: 'Small Kindness',
  5: 'Join the Circle',
  6: 'Keep Talking',
  7: 'Ask & Appreciate',
  8: 'Clear Voice',
  9: 'Small Courage Role',
  10: 'Two-Minute Talk',
  11: 'Wider Connections',
  12: 'Share Your Update',
  13: 'Warm Presence',
  14: 'Continue the Flow',
  15: 'Partner Up',
  16: 'Invite & Include',
  17: 'Calm Confidence',
  18: 'Confident Response',
  19: 'Group Presence',
  20: 'Social Finisher',
};

export function getLevelTitle(level: number) {
  return LEVEL_TITLES[level] ?? LEVEL_TITLE_FALLBACK;
}
