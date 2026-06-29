import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Dare } from '../types/dare';

export type AuthStackParamList = {
  Intro: undefined;
  Login: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Journey: undefined;
  Dares: undefined;
  You: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  PrivacyPolicy: undefined;
  HelpSupport: undefined;
  Settings: undefined;
  TermsConditions: undefined;
  About: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  DareInProgress: {
    dare: Dare;
    easier?: boolean;
  };
  DareCompleted: {
    dare: Dare;
    basePoints: number;
    timingBonus: number;
    levelBonus: number;
    easier?: boolean;
    elapsedSeconds: number;
    completedAt: string;
    completedLevel: number;
    completedStage: number;
    completedDay: number;
    justCompleted?: boolean;
  };
  ShareWin: {
    dare: Dare;
    pointsEarned: number;
  };
};
