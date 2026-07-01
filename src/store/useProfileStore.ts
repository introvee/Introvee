import { create } from 'zustand';
import { getProfile, saveOnboardingProfile, updateProfileDetails } from '../services/profileService';
import type { OnboardingInput, Profile } from '../types/profile';

const profileLoadTimeoutMs = 10000;
let loadedProfileUserId: string | null = null;
let profileLoadUserId: string | null = null;
let profileLoadPromise: Promise<Profile | null> | null = null;

type ProfileState = {
  profile: Profile | null;
  isLoadingProfile: boolean;
  loadProfile: (userId: string) => Promise<Profile | null>;
  completeOnboarding: (userId: string, input: OnboardingInput) => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  updateProfile: (userId: string, input: Partial<Profile> & { avatar_uri?: string }) => Promise<void>;
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoadingProfile: false,
  setProfile: (profile) => {
    loadedProfileUserId = profile?.id ?? null;
    set({ profile });
  },
  loadProfile: async (userId) => {
    const currentProfile = get().profile;
    if (currentProfile?.id === userId && loadedProfileUserId === userId) {
      return currentProfile;
    }

    if (profileLoadPromise && profileLoadUserId === userId) return profileLoadPromise;

    set({ isLoadingProfile: true });
    profileLoadUserId = userId;
    profileLoadPromise = (async () => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      try {
        const timeout = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Profile load timed out')), profileLoadTimeoutMs);
        });
        const profile = await Promise.race([getProfile(userId), timeout]);
        loadedProfileUserId = userId;
        set({ profile });
        return profile;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        profileLoadPromise = null;
        profileLoadUserId = null;
        set({ isLoadingProfile: false });
      }
    })();

    return profileLoadPromise;
  },
  completeOnboarding: async (userId, input) => {
    const profile = await saveOnboardingProfile(userId, input);
    loadedProfileUserId = userId;
    set({ profile });
  },
  updateProfile: async (userId, input) => {
    const profile = await updateProfileDetails(userId, input);
    loadedProfileUserId = userId;
    set({ profile });
  }
}));
