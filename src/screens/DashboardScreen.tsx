import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ArrowRight, CheckCircle2, Flame, Heart } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCompletedDareCount, getTodaysDareLog } from '../services/dareService';
import { getTabBarBottomOffset, getTabBarReservedHeight, TAB_BAR_BASE_HEIGHT } from '../constants/layout';
import { getLevelTitle } from '../constants/levelTitles';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import type { MainTabParamList } from '../navigation/types';
import type { UserDareLog } from '../types/dare';
import { getCompletedDaresFromProgress, getCompletedStagesInCurrentLevel, getConfidencePercent } from '../utils/progressStats';

type Nav = BottomTabNavigationProp<MainTabParamList>;

const levelCovers: Record<number, number> = {
  1: require('../../assets/images/level-1-cover.jpg'),
  2: require('../../assets/images/level-2-cover.jpg'),
  3: require('../../assets/images/level-3-cover.jpg'),
  4: require('../../assets/images/level-4-cover.jpg'),
  5: require('../../assets/images/level-5-cover.jpg'),
  6: require('../../assets/images/level-6-cover.jpg'),
  7: require('../../assets/images/level-7-cover.jpg'),
  8: require('../../assets/images/level-8-cover.jpg'),
  9: require('../../assets/images/level-9-cover.jpg'),
  10: require('../../assets/images/level-10-cover.jpg'),
  11: require('../../assets/images/level-11-cover.jpg'),
  12: require('../../assets/images/level-12-cover.jpg'),
  13: require('../../assets/images/level-13-cover.jpg'),
  14: require('../../assets/images/level-14-cover.jpg'),
  15: require('../../assets/images/level-15-cover.jpg'),
  16: require('../../assets/images/level-16-cover.jpg'),
  17: require('../../assets/images/level-17-cover.jpg'),
  18: require('../../assets/images/level-18-cover.jpg'),
  19: require('../../assets/images/level-19-cover.jpg'),
  20: require('../../assets/images/level-20-cover.jpg')
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
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      async function loadDashboard() {
        if (!user || !profile) {
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        try {
          const timeout = new Promise<never>((_, reject) =>
            timeoutId = setTimeout(() => reject(new Error('Dashboard load timed out after 10s')), 10000)
          );
          const [dayLog, totalCompleted] = await Promise.race([
            Promise.all([
              getTodaysDareLog(user.id),
              getCompletedDareCount(user.id)
            ]),
            timeout.then(() => { throw new Error('timeout'); })
          ]);

          if (active) {
            setTodaysLog(dayLog);
            setCompletedDares(totalCompleted);
          }
        } catch (error) {
          if (active) {
            setTodaysLog(null);
            setCompletedDares(0);
          }
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
          }
          if (active) setIsLoading(false);
        }
      }

      loadDashboard();
      return () => {
        active = false;
        if (timeoutId) clearTimeout(timeoutId);
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
  const completedDareTotal = profile ? getCompletedDaresFromProgress(profile, completedDares, todaysLog) : completedDares;
  const completedStagesInLevel = getCompletedStagesInCurrentLevel(completedDareTotal, currentLevel);
  const currentDay = clamp(profile?.current_day ?? 1, 1, 100);
  const confidence = getConfidencePercent(completedDareTotal);
  const responsive = getDashboardResponsiveStyles(width, height, insets.bottom);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={[styles.container, responsive.container]}
        contentContainerStyle={[styles.content, responsive.content]}
        scrollEnabled={responsive.scrollEnabled}
        bounces={responsive.scrollEnabled}
        showsVerticalScrollIndicator={false}
      >
          <View style={[styles.greetingBlock, responsive.greetingBlock]}>
            <Text style={[styles.greetingTime, responsive.greetingTime]} numberOfLines={1} adjustsFontSizeToFit>
              Hello,
            </Text>
            <View style={styles.greetingNameRow}>
              <Text style={[styles.greetingName, responsive.greetingName]} numberOfLines={1} adjustsFontSizeToFit>
                {profile?.name || 'Friend'}
              </Text>
            </View>
            <Text style={[styles.subtitle, responsive.subtitle]} numberOfLines={1} adjustsFontSizeToFit>
              You're doing great. One step at a time.
            </Text>
          </View>

        <View style={[styles.levelCard, responsive.levelCard]}>
          <View style={styles.levelHeader}>
            <View style={styles.levelHeaderCopy}>
              <Text style={[styles.levelNumber, responsive.levelNumber]} numberOfLines={1} adjustsFontSizeToFit>
                Level {currentLevel}
              </Text>
              <Text style={[styles.levelTitle, responsive.levelTitle]} numberOfLines={1} adjustsFontSizeToFit>
                {getLevelTitle(currentLevel)}
              </Text>
            </View>
            <View style={[styles.dayBadge, responsive.dayBadge]}>
              <Text style={[styles.dayText, responsive.dayText]} numberOfLines={1} adjustsFontSizeToFit>
                Day {currentDay}
              </Text>
            </View>
          </View>
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
            { label: 'Dares', value: completedDareTotal, icon: <CheckCircle2 size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} /> },
            { label: 'Confidence', value: `${confidence}%`, icon: <Heart size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} /> }
          ].map((stat, i, arr) => (
            <View key={stat.label} style={[styles.statCol, i < arr.length - 1 && styles.statColBorder]}>
              <View style={styles.statIcon}>{stat.icon}</View>
              <Text style={[styles.statValue, responsive.statValue]} numberOfLines={1} adjustsFontSizeToFit>{stat.value}</Text>
              <Text style={[styles.statLabel, responsive.statLabel]} numberOfLines={1}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.goalCard, responsive.goalCard]}>
          <View style={styles.goalLinesRow}>
            <Text style={[styles.goalTextBlack, responsive.goalTextBlack]}>Build</Text>
            <View style={styles.highlightBlock}>
              <Text style={[styles.highlightBlockText, responsive.highlightBlockText]}>confidence</Text>
            </View>
            <Text style={[styles.goalTextBlack, responsive.goalTextBlack]}>in</Text>
            <View style={styles.highlightBlock}>
              <Text style={[styles.highlightBlockText, responsive.highlightBlockText]}>100 days.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

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
            <View key={stageNumber} style={[styles.stageStep, index === stageCount - 1 && styles.stageStepLast]}>
              <View style={styles.stageNodeSlot}>
                <View style={[styles.stageNode, isCompleted && styles.stageNodeCompleted, isActive && styles.stageNodeActive]}>
                  {isActive ? <View style={styles.stageNodeActiveDot} /> : null}
                </View>
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
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        resetTimer.current = null;
        resetThumb();
      }, 240);
    });
  }, [maxDrag, onComplete, resetThumb, translateX]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
      translateX.stopAnimation();
    };
  }, [translateX]);

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



function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDashboardResponsiveStyles(width: number, height: number, bottomInset: number) {
  const narrowScreen = width <= 360;
  const compactHeight = height < 820;
  const veryCompactHeight = height < 740;
  const horizontalPadding = clamp(width * 0.055, narrowScreen ? 16 : 18, 20);
  const bottomReserve = TAB_BAR_BASE_HEIGHT + getTabBarBottomOffset(bottomInset) + (compactHeight ? 10 : 16);
  
  // Compact Level Card
  const cardPadding = clamp(height * (compactHeight ? 0.017 : 0.025), veryCompactHeight ? 11 : 14, compactHeight ? 16 : 22);
  const levelFontSize = clamp(width * (compactHeight ? 0.087 : 0.1), compactHeight ? 32 : 38, compactHeight ? 42 : 48);
  const titleFontSize = clamp(width * 0.036, compactHeight ? 13 : 15, compactHeight ? 16 : 18);
  const dayFontSize = clamp(width * 0.05, compactHeight ? 17 : 20, compactHeight ? 21 : 24);
  
  // Cover Image
  const coverHeight = clamp(height * (veryCompactHeight ? 0.15 : compactHeight ? 0.17 : 0.24), veryCompactHeight ? 104 : 124, compactHeight ? 150 : 200);
  
  // Swipe Pill
  const swipeHeight = clamp(height * (compactHeight ? 0.055 : 0.065), compactHeight ? 44 : 50, compactHeight ? 50 : 58);
  const thumbSize = clamp(width * 0.105, compactHeight ? 38 : 42, compactHeight ? 44 : 50);
  
  // Stats
  const statValueFontSize = clamp(width * 0.058, compactHeight ? 18 : narrowScreen ? 20 : 22, compactHeight ? 22 : 25);
  const statTitleFontSize = clamp(width * 0.033, 11, 12);

  // Layout spacing
  const greetingBottom = clamp(height * (compactHeight ? 0.008 : 0.015), compactHeight ? 5 : 10, compactHeight ? 8 : 16);
  const levelCardBottom = clamp(height * (compactHeight ? 0.009 : 0.016), compactHeight ? 7 : 12, compactHeight ? 10 : 18);
  const statsBottom = clamp(height * (compactHeight ? 0.008 : 0.012), compactHeight ? 6 : 8, compactHeight ? 9 : 14);

  return {
    scrollEnabled: veryCompactHeight,
    container: {
      flex: 1
    },
    content: {
      flexGrow: 1,
      justifyContent: 'space-between' as const,
      paddingHorizontal: horizontalPadding,
      paddingTop: clamp(height * (compactHeight ? 0.006 : 0.02), compactHeight ? 5 : 14, compactHeight ? 8 : 22),
      paddingBottom: bottomReserve
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
    subtitle: {
      fontSize: clamp(width * 0.035, compactHeight ? 12 : 14, 15),
      lineHeight: clamp(width * 0.047, compactHeight ? 16 : 20, 21),
      marginTop: compactHeight ? 2 : 5
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
    dayText: {
      fontSize: dayFontSize,
      lineHeight: dayFontSize * 1.28
    },
    dayBadge: {
      minWidth: compactHeight ? 68 : narrowScreen ? 78 : 88,
      paddingHorizontal: narrowScreen ? 8 : 10,
      paddingVertical: compactHeight ? 3 : narrowScreen ? 4 : 5
    },
    coverFrame: {
      height: coverHeight,
      marginTop: compactHeight ? 7 : 10
    },
    progressBlock: {
      marginTop: compactHeight ? 6 : 10,
      marginBottom: compactHeight ? 5 : 8
    },
    swipePill: {
      height: swipeHeight
    },
    swipeThumb: {
      width: thumbSize
    },
    swipeText: {
      fontSize: clamp(width * 0.036, compactHeight ? 12 : 13, compactHeight ? 14 : 15),
      lineHeight: clamp(width * 0.047, compactHeight ? 16 : 18, compactHeight ? 18 : 20),
      paddingLeft: thumbSize + 8
    },
    combinedStatsCard: {
      marginTop: 0,
      marginBottom: statsBottom,
      paddingVertical: compactHeight ? 10 : 18
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
    statLabel: {
      fontSize: clamp(width * 0.03, 10, 11),
      lineHeight: clamp(width * 0.038, 12, 14)
    },
    statIconSize: clamp(width * 0.055, 18, 21),
    fire: {
      fontSize: clamp(width * 0.05, 17, 20),
      lineHeight: clamp(width * 0.06, 20, 24)
    },
    goalCard: {
      marginTop: 0,
      minHeight: clamp(height * (compactHeight ? 0.055 : 0.07), compactHeight ? 44 : 58, compactHeight ? 52 : 68),
      paddingVertical: compactHeight ? 7 : 10,
      paddingHorizontal: clamp(width * 0.04, 16, 24)
    },
    goalTextBlack: {
      fontSize: clamp(width * 0.038, compactHeight ? 13 : 15, compactHeight ? 16 : 18),
      lineHeight: clamp(width * 0.047, compactHeight ? 17 : 19, compactHeight ? 21 : 23)
    },
    highlightBlockText: {
      fontSize: clamp(width * 0.038, compactHeight ? 13 : 15, compactHeight ? 16 : 18),
      lineHeight: clamp(width * 0.047, compactHeight ? 17 : 19, compactHeight ? 21 : 23)
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
  container: { flex: 1, backgroundColor: poster.background },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 108, justifyContent: 'space-between' as const },
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
  levelHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 2
  },
  levelHeaderCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4
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
  dayText: {
    color: '#000000',
    fontSize: 22,
    lineHeight: 28,
    fontFamily: displayFont,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'right',
    zIndex: 2
  },
  dayBadge: {
    minWidth: 88,
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
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
  stageStep: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  stageStepLast: {
    flex: 0
  },
  stageNodeSlot: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center'
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
    justifyContent: 'center'
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
