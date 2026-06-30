-- ============================================================
-- Introvee: Fix RLS Policies
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- This will re-create all RLS policies for every table.
-- ============================================================

-- ==================
-- 1. PROFILES
-- ==================
-- Users can read/update/insert their own profile
drop policy if exists "Profiles are owned by their user" on public.profiles;
create policy "Profiles are owned by their user"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ==================
-- 2. DARES (public read for authenticated users)
-- ==================
drop policy if exists "Authenticated users can read dares" on public.dares;
create policy "Authenticated users can read dares"
  on public.dares
  for select
  to authenticated
  using (true);

-- ==================
-- 3. USER_DARE_LOGS
-- ==================
drop policy if exists "Users manage their dare logs" on public.user_dare_logs;
create policy "Users manage their dare logs"
  on public.user_dare_logs
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ==================
-- 4. BADGES (public read for authenticated users)
-- ==================
drop policy if exists "Authenticated users can read badges" on public.badges;
create policy "Authenticated users can read badges"
  on public.badges
  for select
  to authenticated
  using (true);

-- ==================
-- 5. USER_BADGES
-- ==================
drop policy if exists "Users read their badges" on public.user_badges;
create policy "Users read their badges"
  on public.user_badges
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ==================
-- 6. POINTS_TRANSACTIONS (was missing RLS policies!)
-- ==================
alter table public.points_transactions enable row level security;

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

-- ==================
-- 7. USER_SETTINGS (table does not exist yet, skipping)
-- ==================

-- ==================
-- 8. STORAGE (profile images)
-- ==================
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

-- ==================
-- Done! All RLS policies are now active.
-- ==================
