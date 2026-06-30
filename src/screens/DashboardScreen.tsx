import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Animated, Image, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ArrowRight, CheckCircle2, Flame, Heart, Sparkles } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCompletedDareCount, getTodaysDareLog } from '../services/dareService';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import type { MainTabParamList } from '../navigation/types';
import type { UserDareLog } from '../types/dare';

type Nav = BottomTabNavigationProp<MainTabParamList>;

const levelTitles: Record<number, string> = {
  1: 'Tiny Starts',
  2: 'Growing Braver',
  3: 'Soft Confidence',
  4: 'Small Talk Mode',
  5: 'Comfort Breaker',
  6: 'Voice Unlocked',
  7: 'Social Warm-Up',
  8: 'Brave Interactions',
  9: 'Showing Up',
  10: 'Conversation Builder',
  11: 'Fear Less',
  12: 'Friendly Energy',
  13: 'Open Circle',
  14: 'Confident Moves',
  15: 'People Ready',
  16: 'Social Spark',
  17: 'Bold Presence',
  18: 'Extrovert Mode',
  19: 'Fully Showing Up',
  20: 'Brave New You'
};

const levelCovers: Record<number, number> = {
  1: require('../../assets/images/level-1-cover.png'),
  2: require('../../assets/images/level-2-cover.png'),
  3: require('../../assets/images/level-3-cover.png'),
  4: require('../../assets/images/level-4-cover.png'),
  5: require('../../assets/images/level-5-cover.png'),
  6: require('../../assets/images/level-6-cover.png'),
  7: require('../../assets/images/level-7-cover.png'),
  8: require('../../assets/images/level-8-cover.png'),
  9: require('../../assets/images/level-9-cover.png'),
  10: require('../../assets/images/level-10-cover.png'),
  11: require('../../assets/images/level-11-cover.png'),
  12: require('../../assets/images/level-12-cover.png'),
  13: require('../../assets/images/level-13-cover.png'),
  14: require('../../assets/images/level-14-cover.png'),
  15: require('../../assets/images/level-15-cover.png'),
  16: require('../../assets/images/level-16-cover.png'),
  17: require('../../assets/images/level-17-cover.png'),
  18: require('../../assets/images/level-18-cover.png'),
  19: require('../../assets/images/level-19-cover.png'),
  20: require('../../assets/images/level-20-cover.png')
};

const stageCount = 5;
const swipeInset = 5;

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);
  const [todaysLog, setTodaysLog] = useState<UserDareLog | null>(null);
  const [completedDares, setCompletedDares] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadDashboard() {
        if (!user || !profile) {
          console.log('[Dashboard] No user or profile, skipping load', { user: !!user, profile: !!profile });
          setIsLoading(false);
          return;
        }
        console.log('[Dashboard] Loading dashboard data for user:', user.id);
        setIsLoading(true);
        try {
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Dashboard load timed out after 10s')), 10000)
          );
          const [dayLog, totalCompleted] = await Promise.race([
            Promise.all([
              getTodaysDareLog(user.id),
              getCompletedDareCount(user.id)
            ]),
            timeout.then(() => { throw new Error('timeout'); })
          ]);

          console.log('[Dashboard] Data loaded:', { dayLog: !!dayLog, totalCompleted });
          if (active) {
            setTodaysLog(dayLog);
            setCompletedDares(totalCompleted);
          }
        } catch (error) {
          console.warn('[Dashboard] Error loading dashboard:', error);
          // Don't block the UI — show dashboard with defaults
          if (active) {
            setTodaysLog(null);
            setCompletedDares(0);
          }
        } finally {
          if (active) setIsLoading(false);
        }
      }

      loadDashboard();
      return () => {
        active = false;
      };
    }, [user?.id, profile?.current_level, profile?.current_stage])
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={poster.accent} />
      </View>
    );
  }

  const currentLevel = clamp(profile?.current_level ?? 1, 1, 20);
  const stageInLevel = clamp(profile?.current_stage ?? 1, 1, 5);
  const completedStagesInLevel = getCompletedStagesInLevel(stageInLevel, currentLevel, completedDares, todaysLog);
  const confidence = Math.min(Math.max(Math.round((completedDares / 100) * 100), 0), 100);
  const responsive = getDashboardResponsiveStyles(width, height, insets.bottom);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.container, responsive.container]}>
        <View style={[styles.content, responsive.content]}>
          <View style={[styles.greetingBlock, responsive.greetingBlock]}>
            <Text style={[styles.greetingTime, responsive.greetingTime]} numberOfLines={1} adjustsFontSizeToFit>
              Good morning,
            </Text>
            <View style={styles.greetingNameRow}>
              <Text style={[styles.greetingName, responsive.greetingName]} numberOfLines={1} adjustsFontSizeToFit>
                {profile?.name || 'Friend'}
              </Text>
            </View>
            <Text style={styles.subtitle}>You're doing great. One step at a time.</Text>
          </View>

        <View style={[styles.levelCard, responsive.levelCard]}>
          <Text style={[styles.levelNumber, responsive.levelNumber]}>Level {currentLevel}</Text>
          <Text style={[styles.levelTitle, responsive.levelTitle]}>{levelTitles[currentLevel]}</Text>
          <View style={[styles.coverFrame, responsive.coverFrame]}>
            <Image source={levelCovers[currentLevel]} style={styles.cover} resizeMode="cover" />
          </View>
          <View style={[styles.progressBlock, responsive.progressBlock]}>
            <StageProgressBar completedStages={completedStagesInLevel} />
          </View>
          <SwipeToStart
            onComplete={() => navigation.navigate('Dares')}
            pillHeight={responsive.swipePill.height}
            thumbSize={responsive.swipeThumb.width}
            textStyle={responsive.swipeText}
          />
        </View>

        <View style={[styles.combinedStatsCard, responsive.combinedStatsCard]}>
          {[
            { label: 'Streak', value: profile?.streak_count ?? 0, icon: <Flame size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} /> },
            { label: 'Dares', value: completedDares, icon: <CheckCircle2 size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} /> },
            { label: 'Confidence', value: `${confidence}%`, icon: <Heart size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} /> }
          ].map((stat, i, arr) => (
            <View key={stat.label} style={[styles.statCol, i < arr.length - 1 && styles.statColBorder]}>
              <View style={styles.statIcon}>{stat.icon}</View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.goalCard, responsive.goalCard]}>
          <View style={styles.goalLinesRow}>
            <Text style={[styles.goalTextBlack, responsive.goalTextBlack]}>Became an</Text>
            <View style={styles.highlightBlock}>
              <Text style={[styles.highlightBlockText, responsive.highlightBlockText]}>extrovert</Text>
            </View>
            <Text style={[styles.goalTextBlack, responsive.goalTextBlack]}>in</Text>
            <View style={styles.highlightBlock}>
              <Text style={[styles.highlightBlockText, responsive.highlightBlockText]}>100 days.</Text>
            </View>
          </View>
        </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function StageProgressBar({ completedStages }: { completedStages: number }) {
  const completed = clamp(completedStages, 0, stageCount);
  const activeStage = completed < stageCount ? completed + 1 : stageCount;

  return (
    <View
      style={styles.stageBlock}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${completed} of ${stageCount} stages completed. Stage ${activeStage} ${completed === stageCount ? 'completed' : 'active'}.`}
    >
      <View style={styles.stageTrack}>
        {Array.from({ length: stageCount }).map((_, index) => {
          const stageNumber = index + 1;
          const isCompleted = stageNumber <= completed;
          const isActive = stageNumber === activeStage && completed < stageCount;
          const isConnectorFilled = completed === stageCount || index < completed;

          return (
            <View key={stageNumber} style={styles.stageSegment}>
              <View style={[styles.stageNode, isCompleted && styles.stageNodeCompleted, isActive && styles.stageNodeActive]}>
                {isActive ? <View style={styles.stageNodeActiveDot} /> : null}
              </View>
              {index < stageCount - 1 ? <View style={[styles.stageLine, isConnectorFilled && styles.stageLineCompleted]} /> : null}
            </View>
          );
        })}
      </View>
      <Text style={styles.stageCountText}>{activeStage}/{stageCount}</Text>
    </View>
  );
}

function SwipeToStart({
  onComplete,
  pillHeight,
  thumbSize,
  textStyle
}: {
  onComplete: () => void;
  pillHeight: number;
  thumbSize: number;
  textStyle: { fontSize: number; lineHeight: number; paddingLeft: number };
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const latestX = useRef(0);
  const didComplete = useRef(false);
  const [pillWidth, setPillWidth] = useState(0);
  const maxDrag = Math.max(pillWidth - thumbSize - swipeInset * 2, 0);
  const threshold = maxDrag * 0.74;

  const resetThumb = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 18
    }).start(() => {
      latestX.current = 0;
      didComplete.current = false;
    });
  }, [translateX]);

  const finishSwipe = useCallback(() => {
    if (didComplete.current) return;
    didComplete.current = true;
    Animated.timing(translateX, {
      toValue: maxDrag,
      duration: 160,
      useNativeDriver: true
    }).start(() => {
      onComplete();
      setTimeout(resetThumb, 240);
    });
  }, [maxDrag, onComplete, resetThumb, translateX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4,
      onPanResponderGrant: () => {
        translateX.stopAnimation((value) => {
          latestX.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        const nextX = clamp(latestX.current + gesture.dx, 0, maxDrag);
        translateX.setValue(nextX);
      },
      onPanResponderRelease: (_, gesture) => {
        const nextX = clamp(latestX.current + gesture.dx, 0, maxDrag);
        if (nextX >= threshold) {
          finishSwipe();
        } else {
          resetThumb();
        }
      },
      onPanResponderTerminate: resetThumb
      }),
    [finishSwipe, maxDrag, resetThumb, threshold, translateX]
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Swipe to start stage"
      onPress={finishSwipe}
      onLayout={(event) => setPillWidth(event.nativeEvent.layout.width)}
      style={({ pressed }) => [styles.swipePill, { height: pillHeight }, pressed && styles.pressed]}
    >
      <Text style={[styles.swipeText, textStyle]}>Swipe to start stage</Text>
      <Animated.View style={[styles.swipeThumb, { width: thumbSize, height: thumbSize, borderRadius: thumbSize / 2, transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <ArrowRight color="#FFFFFF" size={23} strokeWidth={2.1} />
      </Animated.View>
    </Pressable>
  );
}



function getCompletedStagesInLevel(stageInLevel: number, currentLevel: number, completedDares: number, todaysLog: UserDareLog | null) {
  const completedBeforeLevel = (currentLevel - 1) * 5;
  const logBased = clamp(completedDares - completedBeforeLevel, 0, 5);
  const profileBased = currentLevel === 20 && stageInLevel === 5 && (todaysLog?.status === 'completed' || todaysLog?.status === 'easier_completed') ? 5 : Math.max(stageInLevel - 1, 0);
  return Math.max(logBased, profileBased);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDashboardResponsiveStyles(width: number, height: number, bottomInset: number) {
  const narrowScreen = width <= 360;
  const horizontalPadding = clamp(width * 0.055, narrowScreen ? 16 : 18, 20);
  
  // Compact Level Card
  const cardPadding = clamp(height * 0.025, 16, 22);
  const levelFontSize = clamp(width * 0.1, 38, 48);
  const titleFontSize = clamp(width * 0.038, 15, 18);
  
  // Cover Image
  const coverHeight = clamp(height * 0.24, 150, 200);
  
  // Swipe Pill
  const swipeHeight = clamp(height * 0.065, 50, 58);
  const thumbSize = clamp(width * 0.11, 42, 50);
  
  // Stats
  const statHeight = clamp(height * 0.09, 74, 88);
  const statGap = clamp(width * 0.025, 8, 10);
  const statValueFontSize = clamp(width * 0.065, narrowScreen ? 20 : 22, 25);
  const statTitleFontSize = clamp(width * 0.033, 11, 12);

  // Layout spacing
  const greetingBottom = clamp(height * 0.015, 10, 16);
  const levelCardBottom = clamp(height * 0.016, 12, 18);
  const statsBottom = clamp(height * 0.012, 8, 14);

  return {
    container: {
      flex: 1,
      overflow: 'hidden' as const
    },
    content: {
      flex: 1,
      justifyContent: 'space-between' as const,
      paddingHorizontal: horizontalPadding,
      paddingTop: clamp(height * 0.02, 14, 22),
      paddingBottom: 84 + bottomInset
    },
    topRow: { marginBottom: greetingBottom },
    greetingBlock: { marginBottom: greetingBottom },
    greetingTime: {
      fontSize: clamp(width * 0.065, 20, 24),
      lineHeight: clamp(width * 0.08, 26, 30)
    },
    greetingName: {
      fontSize: clamp(width * 0.085, 28, 34),
      lineHeight: clamp(width * 0.09, 32, 38)
    },
    levelCard: {
      paddingTop: cardPadding,
      paddingHorizontal: cardPadding,
      paddingBottom: cardPadding,
      marginBottom: levelCardBottom
    },
    levelNumber: {
      fontSize: levelFontSize,
      lineHeight: levelFontSize * 0.95
    },
    levelTitle: {
      fontSize: titleFontSize,
      lineHeight: titleFontSize * 1.25
    },
    coverFrame: {
      height: coverHeight,
      marginTop: 8
    },
    progressBlock: {
      marginTop: 10,
      marginBottom: 8
    },
    swipePill: {
      height: swipeHeight
    },
    swipeThumb: {
      width: thumbSize
    },
    swipeText: {
      fontSize: clamp(width * 0.038, 13, 15),
      lineHeight: clamp(width * 0.05, 18, 20),
      paddingLeft: thumbSize + 8
    },
    combinedStatsCard: {
      marginTop: 0,
      marginBottom: statsBottom
    },
    statCard: {
      height: statHeight,
      borderRadius: 22,
      paddingHorizontal: narrowScreen ? 6 : 8
    },
    statTitle: {
      fontSize: statTitleFontSize,
      lineHeight: statTitleFontSize + 4,
      marginBottom: 4
    },
    statValue: {
      fontSize: statValueFontSize,
      lineHeight: statValueFontSize + 4
    },
    statIconSize: clamp(width * 0.055, 18, 21),
    fire: {
      fontSize: clamp(width * 0.05, 17, 20),
      lineHeight: clamp(width * 0.06, 20, 24)
    },
    goalCard: {
      marginTop: 0,
      minHeight: clamp(height * 0.07, 58, 68),
      paddingVertical: 10,
      paddingHorizontal: clamp(width * 0.04, 16, 24)
    },
    goalTextBlack: {
      fontSize: clamp(width * 0.04, 15, 18),
      lineHeight: clamp(width * 0.05, 19, 23)
    },
    highlightBlockText: {
      fontSize: clamp(width * 0.04, 15, 18),
      lineHeight: clamp(width * 0.05, 19, 23)
    }
  };
}

const poster = {
  background: '#F5F5F3',
  text: '#111111',
  muted: '#6B6B6B',
  card: '#FFFFFF',
  border: 'rgba(0,0,0,0.06)',
  accent: '#2F6B45'
};

const displayFont = Platform.select({
  ios: 'SF Pro Display',
  android: 'sans-serif',
  default: '"Inter", "SF Pro Display", "Satoshi", "Helvetica Neue", Arial, sans-serif'
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: poster.background },
  container: { flex: 1, backgroundColor: poster.background, overflow: 'hidden' as const },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 108, justifyContent: 'space-between' as const },
  center: { flex: 1, backgroundColor: poster.background, alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  greetingBlock: { marginBottom: 20 },
  greetingTime: {
    color: poster.text,
    fontSize: 26,
    lineHeight: 32,
    fontFamily: displayFont,
    fontWeight: '500',
    letterSpacing: 0,
    flexShrink: 1
  },
  greetingNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%', marginTop: 2 },
  greetingName: {
    color: poster.text,
    fontSize: 38,
    lineHeight: 44,
    fontFamily: displayFont,
    fontWeight: '700',
    letterSpacing: 0,
    flexShrink: 1
  },
  subtitle: {
    color: poster.muted,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: displayFont,
    fontWeight: '400',
    marginTop: 5
  },
  levelCard: {
    borderRadius: 24,
    backgroundColor: poster.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: poster.border,
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 45,
    shadowOffset: { width: 0, height: 18 },
    elevation: 3
  },
  levelNumber: {
    color: poster.text,
    fontSize: 54,
    lineHeight: 54,
    fontFamily: displayFont,
    fontWeight: '600',
    letterSpacing: 0,
    zIndex: 2
  },
  levelTitle: {
    color: '#555555',
    fontSize: 20,
    lineHeight: 25,
    fontFamily: displayFont,
    fontWeight: '400',
    letterSpacing: 0,
    marginTop: 2,
    zIndex: 2
  },
  coverFrame: {
    width: '100%',
    height: 214,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: poster.card
  },
  cover: {
    width: '100%',
    height: '100%'
  },
  progressBlock: { alignItems: 'center', marginTop: 10, marginBottom: 8 },
  stageBlock: {
    width: '100%',
    alignItems: 'center'
  },
  stageTrack: {
    width: '76%',
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stageSegment: {
    flex: 1,
    minWidth: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  stageNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D9D9D6',
    borderWidth: 1,
    borderColor: '#D9D9D6'
  },
  stageNodeCompleted: {
    backgroundColor: poster.text,
    borderColor: poster.text
  },
  stageNodeActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: poster.card,
    borderWidth: 1.5,
    borderColor: poster.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -3
  },
  stageNodeActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: poster.text
  },
  stageLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    borderRadius: 1,
    backgroundColor: '#D9D9D6'
  },
  stageLineCompleted: {
    backgroundColor: poster.text
  },
  stageCountText: {
    color: '#777777',
    fontSize: 12,
    lineHeight: 15,
    fontFamily: displayFont,
    fontWeight: '600',
    marginTop: 1
  },
  swipePill: {
    width: '90%',
    height: 58,
    borderRadius: 999,
    backgroundColor: '#F7F7F5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: poster.border,
    justifyContent: 'center',
    paddingHorizontal: 18,
    alignSelf: 'center',
    marginTop: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3
  },
  swipeText: {
    color: poster.text,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: displayFont,
    fontWeight: '600',
    letterSpacing: 0,
    paddingLeft: 56
  },
  swipeThumb: {
    position: 'absolute',
    left: swipeInset,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.72)',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  },
  combinedStatsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    flexDirection: 'row',
    paddingVertical: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 5
  },
  statColBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(255,255,255,0.12)'
  },
  statIcon: {
    marginBottom: 2
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 25,
    fontFamily: displayFont,
    fontWeight: '700',
    letterSpacing: -0.3
  },
  statLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    lineHeight: 14,
    fontFamily: displayFont,
    fontWeight: '500'
  },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.94 },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  goalLinesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4
  },
  goalTextBlack: {
    fontFamily: displayFont,
    fontSize: 18,
    fontWeight: '800',
    color: '#000000'
  },
  highlightBlock: {
    backgroundColor: '#D1FF52',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    transform: [{ rotate: '-1.5deg' }]
  },
  highlightBlockText: {
    fontFamily: displayFont,
    fontSize: 18,
    fontWeight: '900',
    color: '#000000'
  }
});
