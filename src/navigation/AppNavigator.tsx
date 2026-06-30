import { CircleDot, House, Map, UserRound } from 'lucide-react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { AuthNavigator } from './AuthNavigator';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TodayDareScreen } from '../screens/TodayDareScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { DareInProgressScreen } from '../screens/DareInProgressScreen';
import { DareCompletedScreen } from '../screens/DareCompletedScreen';
import { ShareWinScreen } from '../screens/ShareWinScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TermsConditionsScreen } from '../screens/TermsConditionsScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { colors } from '../constants/colors';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import type { MainTabParamList, RootStackParamList, ProfileStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <ProfileStack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <ProfileStack.Screen name="About" component={AboutScreen} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8A8A8A',
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem
      }}
    >
      <Tabs.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <House color={color} size={22} strokeWidth={1.8} />
            </TabIcon>
          )
        }}
      />
      <Tabs.Screen
        name="Dares"
        component={TodayDareScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <CircleDot color={color} size={22} strokeWidth={1.8} />
            </TabIcon>
          )
        }}
      />
      <Tabs.Screen
        name="Journey"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <Map color={color} size={22} strokeWidth={1.8} />
            </TabIcon>
          )
        }}
      />
      <Tabs.Screen
        name="You"
        component={ProfileStackScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <UserRound color={color} size={22} strokeWidth={1.8} />
            </TabIcon>
          )
        }}
      />
    </Tabs.Navigator>
  );
}

function TabIcon({ focused, children }: { focused: boolean; children: ReactNode }) {
  return <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>{children}</View>;
}

export function RootNavigator() {
  const user = useAuthStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);
  const isLoadingProfile = useProfileStore((state) => state.isLoadingProfile);

  if (user && isLoadingProfile && !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <RootStack.Screen key="signed-out" name="Auth" component={AuthNavigator} />
      ) : !profile?.onboarding_completed ? (
        <RootStack.Screen key="needs-onboarding" name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <RootStack.Screen name="Main" component={MainTabs} />
          <RootStack.Screen name="DareInProgress" component={DareInProgressScreen} />
          <RootStack.Screen name="DareCompleted" component={DareCompletedScreen} />
          <RootStack.Screen name="ShareWin" component={ShareWinScreen} />
        </>
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: '9%',
    right: '9%',
    bottom: 18,
    height: 56,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingTop: 6,
    paddingBottom: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7
  },
  tabItem: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeIconWrap: {
    backgroundColor: '#111111'
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  }
});
