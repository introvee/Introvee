import { LifeCategory } from '../constants/lifeCategories';

export type Profile = {
  id: string;
  name: string;
  age: number;
  dob: string | null;
  gender: string;
  life_category: LifeCategory;
  avatar_url: string | null;
  onboarding_completed: boolean;
  current_level: number;
  current_stage: number;
  current_day: number;
  total_points: number;
  streak_count: number;
  created_at: string;
  updated_at: string;
};

export type OnboardingInput = Pick<Profile, 'name' | 'age' | 'dob' | 'gender' | 'life_category' | 'avatar_url'> & {
  avatar_uri?: string | null;
};
