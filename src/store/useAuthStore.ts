import { create } from 'zustand';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { assertSupabaseConfigured, isSupabaseConfigured, supabase } from '../lib/supabase';
import { useProfileStore } from './useProfileStore';
import type { Profile } from '../types/profile';

const nativeOAuthRedirectUri = 'introvee://auth/callback';
const bypassGoogleLogin = false;
const devUserId = '00000000-0000-4000-8000-000000000001';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

type AuthState = {
  user: User | null;
  isBootstrapping: boolean;
  isSigningIn: boolean;
  bootstrap: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

let bootstrapPromise: Promise<void> | null = null;

function getDevUser(): User {
  return {
    id: devUserId,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'dev@introvee.local',
    app_metadata: { provider: 'dev-bypass', providers: ['dev-bypass'] },
    user_metadata: { name: 'Dev User' },
    created_at: new Date(0).toISOString()
  } as User;
}

function getDevProfile(): Profile {
  const now = new Date().toISOString();

  return {
    id: devUserId,
    name: 'Dev User',
    age: 21,
    dob: null,
    gender: 'Prefer not to say',
    life_category: 'Student',
    avatar_url: null,
    onboarding_completed: true,
    current_level: 1,
    current_stage: 1,
    current_day: 1,
    total_points: 0,
    streak_count: 0,
    created_at: now,
    updated_at: now
  };
}

function applyDevBypass(setAuthState: (state: Partial<AuthState>) => void) {
  setAuthState({ user: getDevUser(), isBootstrapping: false, isSigningIn: false });
  useProfileStore.getState().setProfile(getDevProfile());
}

async function loadProfileSafely(userId: string) {
  try {
    await useProfileStore.getState().loadProfile(userId);
  } catch {
    useProfileStore.getState().setProfile(null);
  }
}

function getOAuthRedirectUri() {
  const configuredRedirectUri = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return configuredRedirectUri || window.location.origin;
  }

  return nativeOAuthRedirectUri;
}

function getWebOAuthCode() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return new URL(window.location.href).searchParams.get('code');
}

function clearWebOAuthParams() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isBootstrapping: true,
  isSigningIn: false,
  bootstrap: async () => {
    if (bootstrapPromise) return bootstrapPromise;

    bootstrapPromise = (async () => {
      if (bypassGoogleLogin) {
        applyDevBypass(set);
        return;
      }

      if (!isSupabaseConfigured) {
        set({ user: null, isBootstrapping: false });
        return;
      }

      try {
        const { data: existing, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (existing.session) {
          clearWebOAuthParams();
          const user = existing.session.user;
          set({ user, isBootstrapping: false });
          await loadProfileSafely(user.id);
          return;
        }

        const webCode = getWebOAuthCode();
        if (webCode) {
          let timeoutId: ReturnType<typeof setTimeout> | undefined;
          const timeout = new Promise<never>((_, reject) =>
            timeoutId = setTimeout(() => reject(new Error('Code exchange timed out')), 8000)
          );
          const exchange = supabase.auth.exchangeCodeForSession(webCode);
          const { data: sessionData, error: exchangeError } = await Promise.race([exchange, timeout]).finally(() => {
            if (timeoutId) clearTimeout(timeoutId);
          });
          if (exchangeError) throw exchangeError;
          clearWebOAuthParams();

          const user = sessionData.session?.user ?? null;
          set({ user, isBootstrapping: false });
          if (user) await loadProfileSafely(user.id);
          return;
        }

        set({ user: null, isBootstrapping: false });
      } catch (error) {
        set({ isBootstrapping: false });
        throw error;
      } finally {
        bootstrapPromise = null;
      }
    })();

    return bootstrapPromise;
  },
  loginWithGoogle: async () => {
    set({ isSigningIn: true });
    try {
      if (bypassGoogleLogin) {
        applyDevBypass(set);
        return;
      }

      assertSupabaseConfigured();
      const redirectTo = getOAuthRedirectUri();

      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo }
        });
        if (error) throw error;
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true
        }
      });

      if (error) throw error;
      if (!data.url) throw new Error('Supabase did not return a Google login URL.');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return;

      const callbackUrl = new URL(result.url);
      const code = callbackUrl.searchParams.get('code');

      if (code) {
        const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        const user = sessionData.session?.user ?? null;
        set({ user, isBootstrapping: false });
        if (user) await loadProfileSafely(user.id);
        return;
      }

      const params = new URLSearchParams(callbackUrl.hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (!accessToken || !refreshToken) {
        throw new Error('Google login completed without a Supabase session.');
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      if (sessionError) throw sessionError;

      const user = sessionData.session?.user ?? null;
      set({ user, isBootstrapping: false });
      if (user) await loadProfileSafely(user.id);
    } finally {
      set({ isSigningIn: false });
    }
  },
  logout: async () => {
    if (bypassGoogleLogin) {
      applyDevBypass(set);
      return;
    }

    await supabase.auth.signOut();
    set({ user: null, isBootstrapping: false });
    useProfileStore.getState().setProfile(null);
  }
}));

if (isSupabaseConfigured && !bypassGoogleLogin) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      if (event === 'SIGNED_IN' && session?.user) {
        useAuthStore.setState({ user: session.user, isBootstrapping: false });
        await loadProfileSafely(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ user: null, isBootstrapping: false });
        useProfileStore.getState().setProfile(null);
      }
    } catch {
      useAuthStore.setState({ isBootstrapping: false });
    }
  });
}
