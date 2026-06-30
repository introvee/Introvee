import { create } from 'zustand';
import { getProfile, saveOnboardingProfile, updateProfileDetails } from '../services/profileService';
import type { OnboardingInput, Profile } from '../types/profile';

const profileLoadTimeoutMs = 10000;

type ProfileState = {
  profile: Profile | null;
  isLoadingProfile: boolean;
  loadProfile: (userId: string) => Promise<Profile | null>;
  completeOnboarding: (userId: string, input: OnboardingInput) => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  updateProfile: (userId: string, input: Partial<Profile> & { avatar_uri?: string }) => Promise<void>;
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoadingProfile: false,
  setProfile: (profile) => set({ profile }),
  loadProfile: async (userId) => {
    set({ isLoadingProfile: true });
    try {
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile load timed out')), profileLoadTimeoutMs);
      });
      const profile = await Promise.race([getProfile(userId), timeout]);
      set({ profile });
      return profile;
    } finally {
      set({ isLoadingProfile: false });
    }
  },
  completeOnboarding: async (userId, input) => {
    const profile = await saveOnboardingProfile(userId, input);
    set({ profile });
  },
  updateProfile: async (userId, input) => {
    const profile = await updateProfileDetails(userId, input);
    set({ profile });
  }
}));
