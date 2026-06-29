import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IntroSplashScreen } from '../screens/IntroSplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { useAuthStore } from '../store/useAuthStore';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const user = useAuthStore((state) => state.user);
  return (
    <Stack.Navigator initialRouteName={user ? 'Onboarding' : 'Intro'} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Intro" component={IntroSplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
