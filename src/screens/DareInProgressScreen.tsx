import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../constants/fonts';
import type { RootStackParamList } from '../navigation/types';
import { saveCompletionSnapshot } from '../services/completionSnapshotService';
import { completeDare } from '../services/dareService';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';

type Props = NativeStackScreenProps<RootStackParamList, 'DareInProgress'>;

const MOTIVATION_LINES = [
  'Bravery is loading...',
  'Tiny step. Big courage.',
  'You are already doing it.',
  'Stay calm. Finish the dare.',
  'One awkward moment can become confidence.',
  "Don't escape. Just complete this.",
  'Your future self is watching.',
  'Almost there. Keep going.'
];

const characterImage = require('../../assets/images/page-2.png');

export function DareInProgressScreen({ navigation, route }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [motivationIndex, setMotivationIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const responsive = getProgressResponsiveStyles(width, height, insets.bottom);

  useEffect(() => {
    const stopwatch = setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(stopwatch);
  }, []);

  useEffect(() => {
    const motivationTimer = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false
      }).start(() => {
        setMotivationIndex((current) => (current + 1) % MOTIVATION_LINES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: false
        }).start();
      });
    }, 3000);

    return () => clearInterval(motivationTimer);
  }, [fadeAnim]);

  const stopwatchText = useMemo(() => formatTime(elapsedSeconds), [elapsedSeconds]);

  async function completeCurrentDare() {
    if (!user || !profile) {
      Alert.alert('Session needed', 'Please sign in again to finish this dare.');
      navigation.navigate('Main', { screen: 'Dares' });
      return;
    }

    setIsCompleting(true);
    try {
      const completedAt = new Date().toISOString();
      const completedLevel = profile.current_level;
      const completedStage = profile.current_stage;
      const completedDay = profile.current_day;
      const result = await completeDare(user.id, profile, route.params.dare, route.params.easier, elapsedSeconds);
      await saveCompletionSnapshot({
        userId: user.id,
        dareId: route.params.dare.id,
        status: route.params.easier ? 'easier_completed' : 'completed',
        completedDurationSeconds: elapsedSeconds,
        completedAt,
        level: completedLevel,
        stage: completedStage,
        day: completedDay
      });
      setProfile(result.profile);
      navigation.replace('DareCompleted', {
        dare: route.params.dare,
        basePoints: result.basePoints,
        timingBonus: result.timingBonus,
        levelBonus: result.levelBonus,
        easier: route.params.easier,
        elapsedSeconds,
        completedAt,
        completedLevel,
        completedStage,
        completedDay,
        justCompleted: true
      });
    } catch (error) {
      Alert.alert('Could not complete dare', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={[styles.page, responsive.page]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close dare in progress"
            hitSlop={10}
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <ChevronLeft color={theme.text} size={responsive.iconSize} strokeWidth={2.45} />
          </Pressable>
        </View>

        <View style={[styles.timerBlock, responsive.timerBlock]}>
          <Text style={[styles.timerText, responsive.timerText]}>{stopwatchText}</Text>
        </View>

        <View style={[styles.characterBlock, responsive.characterBlock]}>
          <Image source={characterImage} style={[styles.character, responsive.character]} resizeMode="contain" />
        </View>

        <Animated.Text style={[styles.motivationText, responsive.motivationText, { opacity: fadeAnim }]}>
          {MOTIVATION_LINES[motivationIndex]}
        </Animated.Text>

        <Pressable
          accessibilityRole="button"
          disabled={isCompleting}
          onPress={completeCurrentDare}
          style={({ pressed }) => [styles.doneButton, responsive.doneButton, pressed && !isCompleting && styles.donePressed, isCompleting && styles.disabled]}
        >
          {isCompleting ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
          <Text style={styles.doneText}>{isCompleting ? 'Finishing...' : 'I did it'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getProgressResponsiveStyles(width: number, height: number, bottomInset: number) {
  const shortScreen = height <= 720;
  const veryShortScreen = height <= 640;
  const pageWidth = Math.min(width, 430);
  const characterWidth = clamp(width * 0.35, veryShortScreen ? 114 : 124, shortScreen ? 140 : 158);
  const horizontalPadding = clamp(width * 0.048, 18, 22);

  return {
    page: {
      width: '100%' as const,
      maxWidth: pageWidth,
      alignSelf: 'center' as const,
      paddingHorizontal: horizontalPadding,
      paddingTop: clamp(height * 0.004, 4, 8),
      paddingBottom: Math.max(bottomInset, 16)
    },
    iconSize: clamp(width * 0.056, 20, 23),
    timerBlock: {
      marginTop: clamp(height * 0.09, veryShortScreen ? 42 : 54, shortScreen ? 66 : 78)
    },
    timerText: {
      fontSize: clamp(width * 0.18, veryShortScreen ? 64 : 72, shortScreen ? 84 : 94),
      lineHeight: clamp(width * 0.2, veryShortScreen ? 72 : 82, shortScreen ? 94 : 104)
    },
    characterBlock: {
      marginTop: clamp(height * 0.044, veryShortScreen ? 24 : 32, shortScreen ? 42 : 54)
    },
    character: {
      width: characterWidth,
      height: Math.round(characterWidth * 1.66)
    },
    motivationText: {
      minHeight: veryShortScreen ? 48 : 56,
      marginTop: clamp(height * 0.018, 10, 16),
      fontSize: clamp(width * 0.06, 20, 26),
      lineHeight: clamp(width * 0.075, 26, 32),
      maxWidth: Math.min(pageWidth - horizontalPadding * 2, 340)
    },
    doneButton: {
      width: clamp(width * 0.36, 132, 158),
      height: clamp(height * 0.064, 50, 54),
      marginTop: clamp(height * 0.08, veryShortScreen ? 36 : 48, shortScreen ? 64 : 82)
    }
  };
}

const theme = {
  background: '#FFFFFF',
  text: '#111111',
  muted: '#5F6363',
  shadow: '#000000'
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.background
  },
  page: {
    flex: 1,
    backgroundColor: theme.background
  },
  topBar: {
    minHeight: 42,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  timerBlock: {
    alignItems: 'center'
  },
  timerText: {
    color: theme.text,
    fontFamily: fonts.bold,
    textAlign: 'center',
    letterSpacing: 0
  },
  characterBlock: {
    alignItems: 'center'
  },
  character: {
    shadowColor: theme.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 11 }
  },
  motivationText: {
    color: theme.text,
    fontFamily: fonts.bold,
    fontWeight: '800',
    textAlign: 'center',
    alignSelf: 'center',
    letterSpacing: -0.5
  },
  doneButton: {
    alignSelf: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.text,
    shadowColor: theme.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 4
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    fontFamily: fonts.bold,
    letterSpacing: 0
  },
  donePressed: {
    transform: [{ scale: 0.975 }],
    opacity: 0.92
  },
  pressed: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }]
  },
  disabled: {
    opacity: 0.55
  }
});
