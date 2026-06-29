import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/constants/colors';
import { RootNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/useAuthStore';
import { PointsOverlay } from './src/components/PointsOverlay';

export default function App() {
  const { bootstrap, isBootstrapping } = useAuthStore();

  useEffect(() => {
    bootstrap().catch((error) => {
      console.warn('Could not restore Supabase session', error);
    });
  }, [bootstrap]);

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
      <PointsOverlay />
    </SafeAreaProvider>
  );
}
