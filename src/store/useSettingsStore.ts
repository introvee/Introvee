import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserSettings {
  notifications_enabled: boolean;
  sound_enabled: boolean;
  haptics_enabled: boolean;
}

interface SettingsState {
  settings: UserSettings | null;
  isLoading: boolean;
  fetchSettings: (userId: string) => Promise<void>;
  updateSettings: (userId: string, updates: Partial<UserSettings>) => Promise<void>;
}

const defaultSettings: UserSettings = {
  notifications_enabled: true,
  sound_enabled: true,
  haptics_enabled: true,
};

const devBypassUserId = '00000000-0000-4000-8000-000000000001';
let remoteSettingsUnavailable = false;
let loadedSettingsUserId: string | null = null;
let settingsFetchUserId: string | null = null;
let settingsFetchPromise: Promise<void> | null = null;

function getSettingsStorageKey(userId: string) {
  return `introvee:user-settings:${userId}`;
}

function normalizeSettings(data: Partial<UserSettings> | null | undefined): UserSettings {
  return {
    ...defaultSettings,
    ...data,
  };
}

async function readLocalSettings(userId: string) {
  try {
    const raw = await AsyncStorage.getItem(getSettingsStorageKey(userId));
    return raw ? normalizeSettings(JSON.parse(raw)) : null;
  } catch (error) {
    return null;
  }
}

async function writeLocalSettings(userId: string, settings: UserSettings) {
  await AsyncStorage.setItem(getSettingsStorageKey(userId), JSON.stringify(settings));
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,

  fetchSettings: async (userId: string) => {
    if (userId === devBypassUserId) {
      loadedSettingsUserId = userId;
      set({ settings: defaultSettings, isLoading: false });
      return;
    }

    const currentSettings = get().settings;
    if (currentSettings && loadedSettingsUserId === userId) {
      return;
    }

    if (settingsFetchPromise && settingsFetchUserId === userId) return settingsFetchPromise;

    set({ isLoading: true });
    settingsFetchUserId = userId;
    settingsFetchPromise = (async () => {
      try {
        const localSettings = await readLocalSettings(userId);
        if (localSettings) {
          loadedSettingsUserId = userId;
          set({ settings: localSettings });
        }

        if (remoteSettingsUnavailable) {
          if (!localSettings) {
            loadedSettingsUserId = userId;
            set({ settings: defaultSettings });
            await writeLocalSettings(userId, defaultSettings);
          }
          return;
        }

        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          remoteSettingsUnavailable = true;
          if (!localSettings) {
            loadedSettingsUserId = userId;
            set({ settings: defaultSettings });
            await writeLocalSettings(userId, defaultSettings);
          }
          return;
        }

        if (data) {
          const remoteSettings = normalizeSettings({
            notifications_enabled: data.notifications_enabled,
            sound_enabled: data.sound_enabled,
            haptics_enabled: data.haptics_enabled,
          });
          const nextSettings = localSettings ? { ...remoteSettings, ...localSettings } : remoteSettings;
          loadedSettingsUserId = userId;
          set({ settings: nextSettings });
          await writeLocalSettings(userId, nextSettings);
          return;
        }

        const nextSettings = localSettings ?? defaultSettings;
        loadedSettingsUserId = userId;
        set({ settings: nextSettings });
        await writeLocalSettings(userId, nextSettings);

        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({ user_id: userId, ...nextSettings });
        
        if (insertError) {
          remoteSettingsUnavailable = true;
        }
      } catch (error) {
        const localSettings = await readLocalSettings(userId);
        const nextSettings = localSettings ?? defaultSettings;
        loadedSettingsUserId = userId;
        set({ settings: nextSettings });
        try {
          await writeLocalSettings(userId, nextSettings);
        } catch (localError) {
          return;
        }
      } finally {
        settingsFetchPromise = null;
        settingsFetchUserId = null;
        set({ isLoading: false });
      }
    })();

    return settingsFetchPromise;
  },

  updateSettings: async (userId: string, updates: Partial<UserSettings>) => {
    const previousSettings = get().settings ?? defaultSettings;
    const nextSettings = normalizeSettings({ ...previousSettings, ...updates });
    
    // Optimistic update
    loadedSettingsUserId = userId;
    set({ settings: nextSettings });

    try {
      await writeLocalSettings(userId, nextSettings);

      if (userId === devBypassUserId) {
        return;
      }

      if (remoteSettingsUnavailable) {
        return;
      }

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...nextSettings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        remoteSettingsUnavailable = true;
      }
    } catch (error) {
      set({ settings: previousSettings });
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  },
}));
