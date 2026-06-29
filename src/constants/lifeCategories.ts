export const LIFE_CATEGORIES = [
  'Student',
  'Employee / Worker',
  'Homemaker',
  'Retired'
] as const;

export type LifeCategory = (typeof LIFE_CATEGORIES)[number];

export const genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const;
