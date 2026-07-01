-- Step 1: Generate and insert dares for new categories
with categories(life_category, max_day) as (
  values
    ('Student', 100),
    ('Employee / Worker', 100),
    ('Homemaker', 100),
    ('Retired', 100)
),
generated_dares as (
  select
    'dare-' || lower(regexp_replace(c.life_category || '-' || (((day - 1) / 5)::int + 1) || '-' || (((day - 1) % 5) + 1), '[^a-zA-Z0-9]+', '-', 'g')) as id,
    ((day - 1) / 5)::int + 1 as level,
    ((day - 1) % 5) + 1 as stage,
    day as day_number,
    c.life_category,
    case c.life_category
      when 'Student' then 'Ask one classmate a simple course question.'
      when 'Employee / Worker' then 'Say good morning to one coworker or contact.'
      when 'Homemaker' then 'Start a small warm exchange with someone familiar.'
      when 'Retired' then 'Share a brief, polite greeting with someone in your community.'
      else 'Give one safe, friendly greeting to a familiar person.'
    end as title,
    'Day ' || day || ': take a small social step in your ' || c.life_category || ' context. Keep it brief, respectful, and easy to leave.' as description,
    'Smile, nod, or send a short polite message instead.' as easier_title,
    'No need to stretch too far today. A smaller step still trains confidence.' as easier_description,
    'Choose someone familiar, respectful, and safe. Prefer public daytime or official settings.' as safety_tip,
    case
      when (((day - 1) / 5)::int + 1) <= 7 then 'easy'
      when (((day - 1) / 5)::int + 1) <= 14 then 'medium'
      else 'hard'
    end as difficulty,
    case
      when (((day - 1) / 5)::int + 1) <= 7 then 10
      when (((day - 1) / 5)::int + 1) <= 14 then 20
      else 35
    end as points,
    case
      when (((day - 1) / 5)::int + 1) >= 20 then 'celebration'
      when (((day - 1) / 5)::int + 1) >= 15 then 'confident'
      when (((day - 1) / 5)::int + 1) >= 10 then 'waving'
      when (((day - 1) / 5)::int + 1) >= 5 then 'smiling'
      else 'calm'
    end as mascot_type
  from categories c
  cross join lateral generate_series(1, c.max_day) as day
)
insert into public.dares (
  id, level, stage, day_number, life_category, title, description, easier_title, easier_description, safety_tip, difficulty, points, mascot_type
)
select id, level, stage, day_number, life_category, title, description, easier_title, easier_description, safety_tip, difficulty, points, mascot_type
from generated_dares
on conflict (id) do nothing;

-- Step 2: Migrate existing profiles
UPDATE profiles
SET life_category = CASE
  WHEN LOWER(TRIM(life_category)) IN ('student', 'college student') THEN 'Student'
  WHEN LOWER(TRIM(life_category)) IN ('homemaker', 'home maker', 'housewife', 'househusband') THEN 'Homemaker'
  ELSE 'Employee / Worker'
END
WHERE life_category IS NOT NULL;

-- Step 3: Replace check constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_life_category_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_life_category_check
CHECK (
  life_category IN (
    'Student',
    'Employee / Worker',
    'Homemaker',
    'Retired'
  )
);

-- Step 4: Create points_transactions table
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INT NOT NULL,
  type TEXT NOT NULL,
  level_number INT,
  stage_number INT,
  dare_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for querying user's transactions
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON public.points_transactions(user_id);

-- Step 5: Create award_points RPC
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_points INT,
  p_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_level_number INT DEFAULT NULL,
  p_stage_number INT DEFAULT NULL,
  p_dare_id TEXT DEFAULT NULL
) RETURNS INT AS $$
DECLARE
  v_points_awarded INT := 0;
BEGIN
  -- Prevent duplicates based on type
  IF p_type = 'stage_completed' THEN
    IF EXISTS (SELECT 1 FROM public.points_transactions WHERE user_id = p_user_id AND type = 'stage_completed' AND level_number = p_level_number AND stage_number = p_stage_number) THEN
      RETURN 0;
    END IF;
  ELSIF p_type = 'level_completed' THEN
    IF EXISTS (SELECT 1 FROM public.points_transactions WHERE user_id = p_user_id AND type = 'level_completed' AND level_number = p_level_number) THEN
      RETURN 0;
    END IF;
  ELSIF p_type = 'timing_bonus' THEN
    IF EXISTS (SELECT 1 FROM public.points_transactions WHERE user_id = p_user_id AND type = 'timing_bonus' AND dare_id = p_dare_id) THEN
      RETURN 0;
    END IF;
  ELSIF p_type = 'dare_shared' THEN
    IF EXISTS (SELECT 1 FROM public.points_transactions WHERE user_id = p_user_id AND type = 'dare_shared' AND dare_id = p_dare_id) THEN
      RETURN 0;
    END IF;
  ELSIF p_type = 'app_shared' THEN
    -- Limit to once per day
    IF EXISTS (SELECT 1 FROM public.points_transactions WHERE user_id = p_user_id AND type = 'app_shared' AND created_at >= CURRENT_DATE) THEN
      RETURN 0;
    END IF;
  END IF;

  -- Insert transaction
  INSERT INTO public.points_transactions (user_id, points, type, metadata, level_number, stage_number, dare_id)
  VALUES (p_user_id, p_points, p_type, p_metadata, p_level_number, p_stage_number, p_dare_id);

  v_points_awarded := p_points;

  -- Update total_points in profiles
  UPDATE public.profiles
  SET total_points = COALESCE(total_points, 0) + v_points_awarded
  WHERE id = p_user_id;

  RETURN v_points_awarded;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Add Home donation popup preference
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS donation_popup_enabled BOOLEAN NOT NULL DEFAULT true;
