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

function getOAuthRedirectUri() {
  const configuredRedirectUri = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();
  if (configuredRedirectUri) return configuredRedirectUri;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }

  return makeRedirectUri({
    scheme: 'bravestep',
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
    if (!isSupabaseConfigured) {
      set({ user: null, isBootstrapping: false });
      return;
    }

    try {
      const webCode = getWebOAuthCode();
      if (webCode) {
        const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(webCode);
        if (exchangeError) throw exchangeError;
        clearWebOAuthParams();

        const user = sessionData.session?.user ?? null;
        set({ user, isBootstrapping: false });
        if (user) await useProfileStore.getState().loadProfile(user.id);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const user = data.session?.user ?? null;
      set({ user, isBootstrapping: false });
      if (user) await useProfileStore.getState().loadProfile(user.id);
    } catch (error) {
      set({ user: null, isBootstrapping: false });
      throw error;
    }
  },
  loginWithGoogle: async () => {
    set({ isSigningIn: true });
    try {
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
        set({ user });
        if (user) await useProfileStore.getState().loadProfile(user.id);
        return;
      }

      const params = new URLSearchParams(callbackUrl.hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (!accessToken || !refreshToken) throw new Error('Google login completed without a Supabase session.');

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      if (sessionError) throw sessionError;

      const user = sessionData.session?.user ?? null;
      set({ user });
      if (user) await useProfileStore.getState().loadProfile(user.id);
    } finally {
      set({ isSigningIn: false });
    }
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
    useProfileStore.getState().setProfile(null);
  }
}));
