-- Introvee Supabase setup
-- Run this in the Supabase SQL editor after creating your project.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  age integer not null,
  dob date,
  gender text not null,
  life_category text not null check (
    life_category in (
      'Student',
      'Employee / Worker',
      'Homemaker',
      'Retired'
    )
  ),
  avatar_url text,
  onboarding_completed boolean not null default false,
  current_level integer not null default 1,
  current_stage integer not null default 1,
  current_day integer not null default 1,
  total_points integer not null default 0,
  streak_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists dob date;
alter table public.profiles add column if not exists avatar_url text;

create table if not exists public.dares (
  id text primary key,
  level integer not null,
  stage integer not null,
  day_number integer not null,
  life_category text not null,
  title text not null,
  description text not null,
  easier_title text not null,
  easier_description text not null,
  safety_tip text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  points integer not null,
  mascot_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_dare_logs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  dare_id text references public.dares(id),
  status text not null check (status in ('completed', 'skipped', 'easier_completed', 'ignored')),
  completed_type text,
  points_earned integer not null default 0,
  reflection text,
  photo_url text,
  completed_at timestamptz,
  skipped_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.badges (
  id text primary key,
  name text not null,
  description text not null,
  unlock_condition text not null,
  icon text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null references public.badges(id),
  earned_at timestamptz not null default now()
);

create table if not exists public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  points integer not null,
  type text not null,
  level_number integer,
  stage_number integer,
  dare_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_points_transactions_user_id on public.points_transactions(user_id);

alter table public.profiles enable row level security;
alter table public.dares enable row level security;
alter table public.user_dare_logs enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.points_transactions enable row level security;

drop policy if exists "Profiles are owned by their user" on public.profiles;
create policy "Profiles are owned by their user"
on public.profiles
for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Users can read their profile images" on storage.objects;
create policy "Users can read their profile images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can upload their profile images" on storage.objects;
create policy "Users can upload their profile images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update their profile images" on storage.objects;
create policy "Users can update their profile images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Authenticated users can read dares" on public.dares;
create policy "Authenticated users can read dares"
on public.dares
for select
to authenticated
using (true);

drop policy if exists "Users manage their dare logs" on public.user_dare_logs;
create policy "Users manage their dare logs"
on public.user_dare_logs
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can read badges" on public.badges;
create policy "Authenticated users can read badges"
on public.badges
for select
to authenticated
using (true);

drop policy if exists "Users read their badges" on public.user_badges;
create policy "Users read their badges"
on public.user_badges
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view own transactions" on public.points_transactions;
create policy "Users can view own transactions"
on public.points_transactions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own transactions" on public.points_transactions;
create policy "Users can insert own transactions"
on public.points_transactions
for insert
to authenticated
with check (auth.uid() = user_id);

create or replace function public.award_points(
  p_user_id uuid,
  p_points integer,
  p_type text,
  p_metadata jsonb default '{}'::jsonb,
  p_level_number integer default null,
  p_stage_number integer default null,
  p_dare_id text default null
) returns integer as $$
declare
  v_points_awarded integer := 0;
begin
  if p_type = 'stage_completed' then
    if exists (
      select 1 from public.points_transactions
      where user_id = p_user_id
        and type = 'stage_completed'
        and level_number = p_level_number
        and stage_number = p_stage_number
    ) then
      return 0;
    end if;
  elsif p_type = 'level_completed' then
    if exists (
      select 1 from public.points_transactions
      where user_id = p_user_id
        and type = 'level_completed'
        and level_number = p_level_number
    ) then
      return 0;
    end if;
  elsif p_type = 'timing_bonus' then
    if exists (
      select 1 from public.points_transactions
      where user_id = p_user_id
        and type = 'timing_bonus'
        and dare_id = p_dare_id
    ) then
      return 0;
    end if;
  elsif p_type = 'dare_shared' then
    if exists (
      select 1 from public.points_transactions
      where user_id = p_user_id
        and type = 'dare_shared'
        and dare_id = p_dare_id
    ) then
      return 0;
    end if;
  elsif p_type = 'app_shared' then
    if exists (
      select 1 from public.points_transactions
      where user_id = p_user_id
        and type = 'app_shared'
        and created_at >= current_date
    ) then
      return 0;
    end if;
  end if;

  insert into public.points_transactions (user_id, points, type, metadata, level_number, stage_number, dare_id)
  values (p_user_id, p_points, p_type, p_metadata, p_level_number, p_stage_number, p_dare_id);

  v_points_awarded := p_points;

  update public.profiles
  set total_points = coalesce(total_points, 0) + v_points_awarded
  where id = p_user_id;

  return v_points_awarded;
end;
$$ language plpgsql security definer;

insert into public.badges (id, name, description, unlock_condition, icon)
values
  ('badge-first-step', 'First Step', 'Completed your first Introvee dare.', 'current_day >= 2', 'footprints'),
  ('badge-five-day-flame', 'Five-Day Flame', 'Built a 5-day confidence streak.', 'streak_count >= 5', 'flame'),
  ('badge-level-5-listener', 'Level 5 Listener', 'Reached level 5.', 'current_level >= 5', 'sparkle'),
  ('badge-quiet-courage', 'Quiet Courage', 'Earned 500 total points.', 'total_points >= 500', 'shield')
on conflict (id) do nothing;

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
      when 'Retired' then 'Share a friendly hello with someone in your day.'
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
  id,
  level,
  stage,
  day_number,
  life_category,
  title,
  description,
  easier_title,
  easier_description,
  safety_tip,
  difficulty,
  points,
  mascot_type
)
select
  id,
  level,
  stage,
  day_number,
  life_category,
  title,
  description,
  easier_title,
  easier_description,
  safety_tip,
  difficulty,
  points,
  mascot_type
from generated_dares
on conflict (id) do nothing;

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notifications_enabled boolean not null default true,
  sound_enabled boolean not null default true,
  haptics_enabled boolean not null default true,
  donation_popup_enabled boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

alter table public.user_settings enable row level security;

create policy "Users can view own settings"
on public.user_settings
for select
using (auth.uid() = user_id);

create policy "Users can insert own settings"
on public.user_settings
for insert
with check (auth.uid() = user_id);

create policy "Users can update own settings"
on public.user_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
