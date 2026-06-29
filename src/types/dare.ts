import { LifeCategory } from '../constants/lifeCategories';

export type DareDifficulty = 'easy' | 'medium' | 'hard';
export type DareStatus = 'completed' | 'skipped' | 'easier_completed' | 'ignored';

export type Dare = {
  id: string;
  level: number;
  stage: number;
  day_number: number;
  life_category: LifeCategory;
  title: string;
  description: string;
  easier_title: string;
  easier_description: string;
  safety_tip: string;
  difficulty: DareDifficulty;
  points: number;
  mascot_type: string | null;
  created_at: string;
};

export type UserDareLog = {
  id: string;
  user_id: string;
  dare_id: string | null;
  status: DareStatus;
  completed_type: string | null;
  points_earned: number;
  reflection: string | null;
  photo_url: string | null;
  completed_at: string | null;
  skipped_at: string | null;
  created_at: string;
  dares?: Pick<Dare, 'title' | 'description'> | null;
};
