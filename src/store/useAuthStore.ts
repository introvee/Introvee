import { create } from 'zustand';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { assertSupabaseConfigured, isSupabaseConfigured, supabase } from '../lib/supabase';
import { useProfileStore } from './useProfileStore';

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

async function loadProfileSafely(userId: string, source: string) {
  try {
    await useProfileStore.getState().loadProfile(userId);
    console.log(`[${source}] Profile loaded:`, useProfileStore.getState().profile?.name);
  } catch (error) {
    console.warn(`[${source}] Profile load failed (non-blocking):`, error);
  }
}

function getOAuthRedirectUri() {
  const configuredRedirectUri = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();
  if (configuredRedirectUri) return configuredRedirectUri;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }

  return makeRedirectUri({
    scheme: 'introvee',
    path: 'auth/callback'
  });
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
      if (!isSupabaseConfigured) {
        set({ user: null, isBootstrapping: false });
        return;
      }

      try {
        // First, check if we already have a session (restored from storage)
        console.log('[Bootstrap] Checking for existing session...');
        const { data: existing, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (existing.session) {
          console.log('[Bootstrap] Found existing session for user:', existing.session.user.id);
          // Clean up any stale OAuth params in URL
          clearWebOAuthParams();
          const user = existing.session.user;
          set({ user, isBootstrapping: false });
          console.log('[Bootstrap] Loading profile...');
          await loadProfileSafely(user.id, 'Bootstrap');
          return;
        }

        // No existing session — try exchanging OAuth code if present
        const webCode = getWebOAuthCode();
        if (webCode) {
          console.log('[Bootstrap] Exchanging web OAuth code...');
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Code exchange timed out')), 8000)
          );
          const exchange = supabase.auth.exchangeCodeForSession(webCode);
          const { data: sessionData, error: exchangeError } = await Promise.race([exchange, timeout.then(() => { throw new Error('timeout'); })]);
          if (exchangeError) throw exchangeError;
          clearWebOAuthParams();

          const user = sessionData.session?.user ?? null;
          set({ user, isBootstrapping: false });
          if (user) {
            console.log('[Bootstrap] Loading profile for user:', user.id);
            await loadProfileSafely(user.id, 'Bootstrap');
          }
          return;
        }

        // No session and no code — user is not logged in
        console.log('[Bootstrap] No session found');
        set({ user: null, isBootstrapping: false });
      } catch (error) {
        console.warn('[Bootstrap] Error:', error);
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
      console.log('Google login button clicked');
      assertSupabaseConfigured();
      const redirectTo = getOAuthRedirectUri();
      console.log('Generating OAuth URL...', redirectTo);

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

      if (error) {
        console.error('Error getting OAuth URL:', error);
        throw error;
      }
      if (!data.url) throw new Error('Supabase did not return a Google login URL.');
      console.log('OAuth URL generated:', data.url);

      console.log('Opening browser...');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      console.log('Browser opened, redirect received:', result);
      
      if (result.type !== 'success') {
        console.log('Browser was cancelled or dismissed');
        return;
      }

      const callbackUrl = new URL(result.url);
      const code = callbackUrl.searchParams.get('code');

      if (code) {
        const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        const user = sessionData.session?.user ?? null;
        set({ user, isBootstrapping: false });
        if (user) await loadProfileSafely(user.id, 'Login');
        return;
      }

      const params = new URLSearchParams(callbackUrl.hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (!accessToken || !refreshToken) {
        console.error('Google login completed without a Supabase session.', callbackUrl.toString());
        throw new Error('Google login completed without a Supabase session.');
      }

      console.log('access_token found:', !!accessToken);
      console.log('refresh_token found:', !!refreshToken);

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      if (sessionError) {
        console.error('Error saving Supabase session:', sessionError);
        throw sessionError;
      }

      console.log('Supabase session saved');

      const user = sessionData.session?.user ?? null;
      set({ user, isBootstrapping: false });
      if (user) await loadProfileSafely(user.id, 'Login');
    } catch (e) {
      console.error('Login error:', e);
      throw e;
    } finally {
      set({ isSigningIn: false });
    }
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isBootstrapping: false });
    useProfileStore.getState().setProfile(null);
  }
}));

if (isSupabaseConfigured) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[Auth] State changed:', event);

    try {
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[Auth] User signed in:', session.user.id);
        useAuthStore.setState({ user: session.user, isBootstrapping: false });
        await loadProfileSafely(session.user.id, 'Auth');
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] User signed out');
        useAuthStore.setState({ user: null, isBootstrapping: false });
        useProfileStore.getState().setProfile(null);
      }
    } catch (error) {
      console.warn('[Auth] State change handler failed:', error);
      useAuthStore.setState({ isBootstrapping: false });
    }
  });
}
