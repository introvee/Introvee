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
        set({ user });
        if (user) await useProfileStore.getState().loadProfile(user.id);
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
      set({ user });
      if (user) await useProfileStore.getState().loadProfile(user.id);
    } catch (e) {
      console.error('Login error:', e);
      throw e;
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

// Setup global auth state listener as requested
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event);
  if (event === 'SIGNED_IN') {
    console.log('User signed in');
    console.log('Navigating to dashboard/home');
    useAuthStore.setState({ user: session?.user ?? null });
    if (session?.user) {
      await useProfileStore.getState().loadProfile(session.user.id);
    }
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null });
    useProfileStore.getState().setProfile(null);
  }
});
