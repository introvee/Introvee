import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

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

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,

  fetchSettings: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned
        console.error('Error fetching settings:', error);
      }

      if (data) {
        set({
          settings: {
            notifications_enabled: data.notifications_enabled,
            sound_enabled: data.sound_enabled,
            haptics_enabled: data.haptics_enabled,
          }
        });
      } else {
        // Create default settings if they don't exist
        const defaultSettings = {
          notifications_enabled: true,
          sound_enabled: true,
          haptics_enabled: true,
        };
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({ user_id: userId, ...defaultSettings });
        
        if (insertError) {
          console.error('Error creating default settings:', insertError);
        } else {
          set({ settings: defaultSettings });
        }
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateSettings: async (userId: string, updates: Partial<UserSettings>) => {
    const previousSettings = get().settings;
    
    // Optimistic update
    set({ settings: { ...previousSettings, ...updates } as UserSettings });

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      // Revert optimistic update
      set({ settings: previousSettings });
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  },
}));
