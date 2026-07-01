# Introvee

Introvee is an Expo React Native app for adults who want to build social confidence through one safe daily dare for 100 days.

## Stack

- React Native + Expo
- TypeScript
- Supabase Auth + Supabase Postgres
- Google login
- React Navigation
- Zustand

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor and run:

```text
supabase.sql
```

3. Enable Google as an auth provider in Supabase.
4. In Google Cloud Console, open the OAuth client used by Supabase and add this Authorized redirect URI:

```text
https://tamdbugffrsearuizaqm.supabase.co/auth/v1/callback
```

5. Add these redirect URLs in Supabase Auth URL settings:

```text
introvee://auth/callback
https://introvee.vercel.app/
http://localhost:8083/
```

For production web, set the Supabase Site URL to:

```text
https://introvee.vercel.app/
```

For local Expo web testing, this repo currently uses:

```text
http://localhost:8083/
```

Add that URL to Supabase Redirect URLs while testing locally.

6. Add these environment variables before starting Expo:

```bash
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_AUTH_REDIRECT_URL=https://introvee.vercel.app/
```

## Install

```bash
npm install
```

## Run

```bash
npm start
```

Then open in Expo Go, an emulator, or web.

## Main Flows

- Google-only login
- 18+ onboarding
- Life Category selection
- Personalized dare display
- Done button
- Ignore button
- After Ignore: `Try Easier Dare` and `Skip Today`
- Points system
- Progress tracking
- Profile screen

## Data

The Supabase setup script creates and seeds:

- `profiles`
- `dares`
- `user_dare_logs`
- `badges`
- `user_badges`

It includes 100 `General Adult` dares and 20 starter dares for every other life category.
