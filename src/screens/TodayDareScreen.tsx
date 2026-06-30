import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Heart,
  Lightbulb,
  Lock,
  Sparkles,
  TrendingUp
} from 'lucide-react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { copy } from '../constants/copy';
import { fonts } from '../constants/fonts';
import { getTabBarReservedHeight } from '../constants/layout';
import { getTodayDare, getTodaysDareLog } from '../services/dareService';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import type { RootStackParamList } from '../navigation/types';
import type { Dare, UserDareLog } from '../types/dare';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TodayDareScreen() {
  const navigation = useNavigation<Nav>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);
  const [dare, setDare] = useState<Dare | null>(null);
  const [todaysLog, setTodaysLog] = useState<UserDareLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [easierMode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const responsive = getDareResponsiveStyles(width, height, insets.bottom);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        if (!user || !profile) return;
        setIsLoading(true);
        try {
          const closedLog = await getTodaysDareLog(user.id);
          if (closedLog) {
            if (active) {
              setTodaysLog(closedLog);
              setDare(null);
              setMessage(getClosedDayMessage(closedLog));
            }
            return;
          }

          const next = await getTodayDare(profile);
          if (active) {
            setTodaysLog(null);
            setDare(next);
            setMessage(null);
          }
        } catch (error) {
          Alert.alert('Could not load dare', error instanceof Error ? error.message : 'Please try again.');
        } finally {
          if (active) setIsLoading(false);
        }
      }

      load();
      return () => {
        active = false;
      };
    }, [user?.id, profile?.current_day, profile?.life_category])
  );

  function handleStartDare() {
    if (!dare) return;
    navigation.navigate('DareInProgress', {
      dare,
      easier: easierMode
    });
  }

  if (isLoading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.text} />
      </View>
    );
  }

  if (todaysLog && todaysLog.status !== 'skipped') {
    return <CompletedTodayScreen onGoHome={() => navigation.navigate('Main', { screen: 'Home' })} onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main', { screen: 'Home' })} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, responsive.content]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
            hitSlop={10}
            style={styles.iconButton}
            onPress={() => navigation.navigate('Main', { screen: 'Home' })}
          >
            <ArrowLeft color={theme.text} size={responsive.navIconSize} strokeWidth={2.45} />
          </Pressable>
          <View style={styles.brandBlock}>
            <Text style={[styles.brandTitle, responsive.brandTitle]}>Introvee</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Save dare" hitSlop={10} style={styles.iconButton}>
            <Heart color={theme.text} size={responsive.navIconSize} strokeWidth={2.25} />
          </Pressable>
        </View>

        {todaysLog ? (
          <ClosedDayCard log={todaysLog} />
        ) : dare ? (
          <>
            <View style={[styles.sectionHeader, responsive.sectionHeader]}>
              <Text style={styles.sectionTitle}>Today’s Dare</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Status: {(todaysLog as any) ? ((todaysLog as any).status === 'skipped' ? 'Skipped' : 'Completed') : 'Not completed'}</Text>
              </View>
            </View>
            <DareHeroCard dare={dare} easierMode={easierMode} statusText={(todaysLog as any) ? ((todaysLog as any).status === 'skipped' ? 'Skipped' : 'Completed') : 'Not completed'} responsive={responsive} />
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <MascotActionButtons
              disabled={false}
              isSaving={false}
              onAccept={handleStartDare}
              responsive={responsive}
            />
          </>
        ) : (
          <Text style={styles.message}>No dare found yet. Add seed data to begin.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DareHeroCard({
  dare,
  easierMode,
  statusText,
  responsive
}: {
  dare: Dare;
  easierMode: boolean;
  statusText: string;
  responsive: ReturnType<typeof getDareResponsiveStyles>;
}) {
  const [tipVisible, setTipVisible] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const rawTipText = easierMode ? dare.easier_description : dare.description;
  const tipText = rawTipText?.trim() || 'No tip available for this dare yet.';
  const shakeRotation = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-7deg', '7deg']
  });

  useEffect(() => {
    const runShake = () => {
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 90, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0.75, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -0.45, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 90, useNativeDriver: true })
      ]).start();
    };

    const interval = setInterval(runShake, 10000);
    return () => clearInterval(interval);
  }, [shakeAnim]);

  return (
    <View style={[styles.cardStage, responsive.cardStage]}>
      <View style={[styles.heroCard, responsive.heroCard]}>
        <View style={styles.cardTopRow}>
          <View style={[styles.darePill, responsive.darePill]}>
            <Text style={[styles.darePillText, responsive.darePillText]}>DARE</Text>
          </View>
        </View>

        <View style={styles.middleRow}>
          <View style={styles.titleArea}>
            <Text style={[styles.heroTitle, responsive.heroTitle]}>{dare.title}</Text>
            <DoodleUnderline width={responsive.underlineWidth} />
          </View>
          <Pressable 
            style={styles.tipButton}
            onPress={() => setTipVisible(true)}
            hitSlop={12}
            accessibilityLabel="Show tip"
          >
            <Animated.View style={{ transform: [{ translateX: shakeAnim }, { rotate: shakeRotation }] }}>
              <Lightbulb size={16} color="#FFFFFF" strokeWidth={2.5} />
            </Animated.View>
          </Pressable>
        </View>

        <View style={[styles.dashedDivider, responsive.dashedDivider]}>
          {Array.from({ length: responsive.dashCount }).map((_, index) => (
            <View key={index} style={styles.dash} />
          ))}
        </View>

        <View style={styles.infoGrid}>
          <InfoColumn
            icon={<CircleDot color={theme.cardMuted} size={responsive.infoIconSize} strokeWidth={2} />}
            label="Difficulty"
            value={formatDifficulty(dare.difficulty)}
            responsive={responsive}
          />
          <View style={styles.infoSeparator} />
          <InfoColumn
            icon={<TrendingUp color={theme.cardMuted} size={responsive.infoIconSize + 1} strokeWidth={1.9} />}
            label="Current level"
            value={`Level ${dare.level}`}
            subtext={`Stage ${dare.stage}/5`}
            responsive={responsive}
          />
          <View style={styles.infoSeparator} />
          <InfoColumn
            icon={<Sparkles color={theme.cardMuted} size={responsive.infoIconSize + 1} strokeWidth={1.9} />}
            label="Day"
            value={`Day ${dare.day_number}/100`}
            responsive={responsive}
          />
          <View style={styles.infoSeparator} />
          <InfoColumn
            icon={<CheckCircle2 color={theme.cardMuted} size={responsive.infoIconSize + 1} strokeWidth={1.9} />}
            label="Points"
            value={`+${dare.points}`}
            subtext={statusText}
            responsive={responsive}
          />
        </View>
      </View>

      <Modal
        visible={tipVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTipVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setTipVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalIconBox}>
              <Lightbulb size={24} color="#111" strokeWidth={2.5} />
            </View>
            <Text style={styles.modalTitle}>Quick Tip</Text>
            <Text style={styles.modalText}>{tipText}</Text>
            
            <Pressable style={styles.modalButton} onPress={() => setTipVisible(false)}>
              <Text style={styles.modalButtonText}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function InfoColumn({
  icon,
  label,
  value,
  subtext,
  responsive
}: {
  icon: ReactNode;
  label: string;
  value: string;
  subtext?: string;
  responsive: ReturnType<typeof getDareResponsiveStyles>;
}) {
  return (
    <View style={styles.infoColumn}>
      <View style={[styles.infoIconSlot, responsive.infoIconSlot]}>{icon}</View>
      <Text style={[styles.infoLabel, responsive.infoLabel]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
      <Text style={[styles.infoValue, responsive.infoValue]} numberOfLines={2} adjustsFontSizeToFit>{value}</Text>
      {subtext ? <Text style={[styles.infoSubtext, responsive.infoSubtext]} numberOfLines={1} adjustsFontSizeToFit>{subtext}</Text> : null}
    </View>
  );
}

function MascotActionButtons({
  disabled,
  isSaving,
  onAccept,
  responsive
}: {
  disabled: boolean;
  isSaving: boolean;
  onAccept: () => void | Promise<void>;
  responsive: ReturnType<typeof getDareResponsiveStyles>;
}) {
  return (
    <View style={[styles.actionSection, responsive.actionSection]}>
      <View style={styles.actionColumn}>
        <Image
          source={require('../../assets/images/i-will-do-it-button.png')}
          style={[styles.actionMascot, responsive.actionMascot]}
          resizeMode="contain"
        />
        <SwipeConfirmButton
          disabled={disabled}
          isSaving={isSaving}
          onConfirm={onAccept}
          responsive={responsive}
        />
      </View>
    </View>
  );
}

function SwipeConfirmButton({
  disabled,
  isSaving,
  onConfirm,
  responsive
}: {
  disabled: boolean;
  isSaving: boolean;
  onConfirm: () => void | Promise<void>;
  responsive: ReturnType<typeof getDareResponsiveStyles>;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const currentX = useRef(0);
  const hasConfirmed = useRef(false);
  const trackStyle = responsive.swipeTrack ?? { width: 300, height: 60, borderRadius: 30, padding: 5 };
  const handleStyle = responsive.swipeHandle ?? { width: 50, height: 50, borderRadius: 25 };
  const metrics = responsive.swipeMetrics ?? { travelDistance: 240, iconSize: 18 };
  const travelDistance = metrics.travelDistance;
  const threshold = travelDistance * 0.72;

  const resetHandle = useCallback(() => {
    currentX.current = 0;
    hasConfirmed.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      speed: 18,
      bounciness: 5
    }).start();
  }, [translateX]);

  const confirmSwipe = useCallback(() => {
    if (disabled || hasConfirmed.current) return;
    hasConfirmed.current = true;
    currentX.current = travelDistance;
    Animated.timing(translateX, {
      toValue: travelDistance,
      duration: 140,
      useNativeDriver: false
    }).start(() => {
      Promise.resolve(onConfirm()).finally(resetHandle);
    });
  }, [disabled, onConfirm, resetHandle, translateX, travelDistance]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderMove: (_, gestureState) => {
          if (disabled || hasConfirmed.current) return;
          const nextX = clamp(gestureState.dx, 0, travelDistance);
          currentX.current = nextX;
          translateX.setValue(nextX);
        },
        onPanResponderRelease: () => {
          if (disabled || hasConfirmed.current) return;
          if (currentX.current >= threshold) {
            confirmSwipe();
            return;
          }
          resetHandle();
        },
        onPanResponderTerminate: resetHandle
      }),
    [confirmSwipe, disabled, resetHandle, threshold, translateX, travelDistance]
  );

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel="Swipe to confirm dare"
      accessibilityState={{ disabled }}
      style={[styles.swipeTrack, trackStyle, disabled && styles.disabled]}
    >
      <View style={styles.swipeTextWrap}>
        <Text style={[styles.swipeText, responsive.actionButtonText]} numberOfLines={1} adjustsFontSizeToFit>
          {isSaving ? 'Confirming...' : "I'm ready to do it"}
        </Text>
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.swipeHandle,
          handleStyle,
          {
            transform: [{ translateX }]
          }
        ]}
      >
        <ChevronRight color={theme.text} size={metrics.iconSize} strokeWidth={2.65} />
      </Animated.View>
    </View>
  );
}

function DoodleUnderline({ width }: { width: number }) {
  return (
    <Svg width={width} height={16} viewBox={`0 0 ${width} 16`} style={styles.underline}>
      <Path
        d={`M4 9 C${width * 0.24} 1 ${width * 0.66} 2 ${width - 8} 7 C${width * 0.72} 9 ${width * 0.34} 12 7 13`}
        stroke="#EDEDED"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity={0.78}
      />
    </Svg>
  );
}

function CompletedPastelBlob() {
  return (
    <Svg
      width="100%"
      height="100"
      viewBox="0 0 320 100"
      preserveAspectRatio="xMidYMid slice"
      style={styles.pastelBlobSvg}
    >
      <Defs>
        <LinearGradient id="blob1" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F3D9FF" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#D9EDFF" stopOpacity="0.35" />
        </LinearGradient>
        <LinearGradient id="blob2" x1="1" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE8D5" stopOpacity="0.5" />
          <Stop offset="1" stopColor="#FFF3D9" stopOpacity="0.25" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="60" cy="55" rx="90" ry="62" fill="url(#blob1)" />
      <Ellipse cx="260" cy="45" rx="80" ry="56" fill="url(#blob2)" />
      <Circle cx="160" cy="80" r="38" fill="#EBF5FF" fillOpacity="0.28" />
    </Svg>
  );
}

function CompletedTodayScreen({ onGoHome, onBack }: { onGoHome: () => void; onBack: () => void }) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 720;
  const veryCompact = height < 640;
  const mascotWidth = veryCompact ? 145 : Math.min(165, Math.max(145, width * 0.423));
  const mascotHeight = Math.round(mascotWidth * (230 / 165));

  return (
    <SafeAreaView style={completedStyles.screen} edges={['top', 'bottom']}>
      {/* Back arrow — top-left, no circle, no border */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        hitSlop={12}
        style={[completedStyles.backArrow, { top: insets.top + 14, left: insets.left + 20 }]}
      >
        <ArrowLeft size={24} color="#2A1715" strokeWidth={1.9} />
      </Pressable>

      <ScrollView
        style={completedStyles.scroll}
        contentContainerStyle={[
          completedStyles.content,
          compact && completedStyles.contentCompact,
          veryCompact && completedStyles.contentVeryCompact,
          { paddingBottom: insets.bottom + (veryCompact ? 24 : 40) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot */}
        <Image
          source={require('../../assets/images/i-will-do-it-button.png')}
          style={[completedStyles.mascot, compact && completedStyles.mascotCompact, { width: mascotWidth, height: mascotHeight }]}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={[completedStyles.title, compact && completedStyles.titleCompact]}>
          You did it today
        </Text>

        {/* Subtitle */}
        <Text style={[completedStyles.subtitle, compact && completedStyles.subtitleCompact]}>
          Let's meet tomorrow{"\n"}with something special.
        </Text>

        {/* Small line */}
        <Text style={completedStyles.smallLine}>
          Your next brave step is waiting.
        </Text>


      </ScrollView>
    </SafeAreaView>
  );
}

function ClosedDayCard({ log }: { log: UserDareLog }) {
  const didComplete = log.status !== 'skipped';

  if (!didComplete) {
    return (
      <View style={styles.closedCard}>
        <View style={styles.closedIcon}>
          <CheckCircle2 color={theme.text} size={34} strokeWidth={2.4} />
        </View>
        <Text style={styles.closedTitle}>Today is closed</Text>
        <Text style={styles.closedCopy}>{copy.todaySkipped}</Text>
      </View>
    );
  }

  // Completed state is now handled by CompletedTodayScreen at the TodayDareScreen level
  return null;
}

function getClosedDayMessage(log: UserDareLog) {
  return log.status === 'skipped' ? copy.todaySkipped : copy.todayCompleted;
}

function formatDifficulty(difficulty: Dare['difficulty']) {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDareResponsiveStyles(width: number, height: number, bottomInset: number) {
  const shortScreen = height <= 720;
  const veryShortScreen = height <= 640;
  const narrowScreen = width <= 370;
  const horizontalPadding = clamp(width * 0.052, 16, 22);
  const cardPadding = clamp(width * 0.056, 18, 24);
  const titleSize = clamp(width * 0.085, narrowScreen ? 28 : 30, shortScreen ? 34 : 37);
  const cardTopMargin = clamp(height * 0.024, 12, 22);
  const cardRadius = clamp(width * 0.062, 22, 28);
  const compactActionLayout = width <= 360;
  const actionMascotHeight = compactActionLayout ? 104 : clamp(height * 0.155, 114, 134);
  const swipeButtonHeight = clamp(height * 0.076, veryShortScreen ? 58 : 60, 64);
  const swipeButtonWidth = clamp(width * 0.78, compactActionLayout ? 246 : 274, 326);
  const swipeHandleInset = 5;
  const swipeHandleSize = swipeButtonHeight - swipeHandleInset * 2;
  const buttonTextSize = clamp(width * 0.039, 14, 16);
  const infoTextSize = clamp(width * 0.028, 10.5, 12);
  const dashCount = Math.max(12, Math.floor((width - horizontalPadding * 2 - cardPadding * 2) / 17));

  return {
    content: {
      paddingHorizontal: horizontalPadding,
      paddingTop: clamp(height * 0.006, 4, 10),
      paddingBottom: getTabBarReservedHeight(bottomInset),
      minHeight: height
    },
    sectionHeader: {
      flexDirection: (narrowScreen ? 'column' : 'row') as 'column' | 'row',
      alignItems: (narrowScreen ? 'flex-start' : 'center') as 'flex-start' | 'center',
      justifyContent: 'space-between' as const,
      marginTop: clamp(height * 0.03, 16, 28),
      gap: narrowScreen ? 8 : 12
    },
    brandTitle: {
      fontSize: clamp(width * 0.058, 21, 25),
      lineHeight: clamp(width * 0.069, 25, 29)
    },
    brandSubtitle: {
      fontSize: clamp(width * 0.034, 12, 14),
      lineHeight: clamp(width * 0.044, 16, 18)
    },
    cardStage: {
      marginTop: cardTopMargin
    },
    heroCard: {
      borderRadius: cardRadius,
      paddingHorizontal: cardPadding,
      paddingTop: clamp(height * 0.028, 18, 24),
      paddingBottom: clamp(height * 0.027, 18, 24),
      minHeight: veryShortScreen ? 262 : shortScreen ? 280 : 306,
      transform: [{ rotate: width >= 390 ? '-0.7deg' : '0deg' }]
    },
    darePill: {
      minWidth: clamp(width * 0.19, 72, 86),
      height: clamp(height * 0.032, 25, 30),
      borderRadius: 999
    },
    darePillText: {
      fontSize: clamp(width * 0.027, 10, 12)
    },
    heroTitle: {
      fontSize: titleSize,
      lineHeight: titleSize * 1.14
    },
    underlineWidth: clamp(width * 0.42, 142, 178),
    heroSupport: {
      fontSize: clamp(width * 0.038, 13.5, 16),
      lineHeight: clamp(width * 0.054, 18, 21)
    },
    dashedDivider: {
      marginTop: clamp(height * 0.026, 16, 22) + 12, // Adjusted spacer to match removed description gap
      marginBottom: clamp(height * 0.023, 14, 20)
    },
    dashCount,
    infoIconSize: clamp(width * 0.044, 16, 19),
    infoIconSlot: {
      height: clamp(height * 0.029, 20, 24)
    },
    infoLabel: {
      fontSize: infoTextSize,
      lineHeight: infoTextSize + 4
    },
    infoValue: {
      fontSize: clamp(width * 0.034, 12.5, 15),
      lineHeight: clamp(width * 0.047, 17, 20)
    },
    infoSubtext: {
      fontSize: clamp(width * 0.029, 11, 12.5),
      lineHeight: clamp(width * 0.041, 15, 17)
    },
    actionSection: {
      marginTop: veryShortScreen ? 12 : 16,
      paddingHorizontal: 0
    },
    actionMascot: {
      height: actionMascotHeight,
      marginBottom: compactActionLayout ? 10 : 12
    },
    swipeTrack: {
      width: swipeButtonWidth,
      height: swipeButtonHeight,
      borderRadius: swipeButtonHeight / 2,
      padding: swipeHandleInset
    },
    swipeHandle: {
      width: swipeHandleSize,
      height: swipeHandleSize,
      borderRadius: swipeHandleSize / 2
    },
    swipeMetrics: {
      travelDistance: swipeButtonWidth - swipeHandleSize - swipeHandleInset * 2,
      iconSize: clamp(width * 0.045, 17, 20)
    },
    actionButtonText: {
      fontSize: buttonTextSize,
      lineHeight: buttonTextSize + 5
    },
    navIconSize: 24
  };
}

const theme = {
  background: '#F4F4F2',
  text: '#111111',
  muted: '#6A6A66',
  card: '#FFFFFF',
  cardText: '#FFFFFF',
  cardMuted: '#C9C9C7',
  cardBlack: '#111111',
  cardBlackSoft: '#1D1D1B',
  accent: '#FFFFFF',
  border: 'rgba(17,17,17,0.13)',
  shadow: '#000000'
};

// ── Completed-today screen styles (mirrors IntroSplashScreen) ──────────────
const completedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F3'
  },
  scroll: {
    flex: 1
  },
  backArrow: {
    position: 'absolute',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 52
  },
  contentCompact: {
    paddingBottom: 38
  },
  contentVeryCompact: {
    paddingBottom: 26
  },
  mascot: {
    alignSelf: 'center',
    marginBottom: 75
  },
  mascotCompact: {
    marginBottom: 52
  },
  title: {
    width: '80%',
    color: '#2A1715',
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontWeight: '400',
    marginBottom: 20
  },
  titleCompact: {
    fontSize: 32,
    lineHeight: 38
  },
  subtitle: {
    width: '78%',
    color: '#6F6F76',
    fontSize: 20,
    lineHeight: 29,
    letterSpacing: -0.2,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontWeight: '400',
    marginBottom: 14
  },
  subtitleCompact: {
    fontSize: 18,
    lineHeight: 26
  },
  smallLine: {
    color: '#A89F9A',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontWeight: '400',
    marginBottom: 85
  },
  nextButton: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: '#2A1715',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    shadowColor: '#2A1715',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  },
  nextButtonCompact: {
    width: 66,
    height: 66
  },
  nextPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9
  }
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1, backgroundColor: theme.background },
  content: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 116 },
  center: { flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandBlock: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 8
  },
  brandTitle: {
    color: theme.text,
    fontFamily: fonts.bold,
    letterSpacing: 0
  },
  brandSubtitle: {
    color: theme.muted,
    fontFamily: fonts.regular,
    marginTop: 2,
    letterSpacing: 0
  },
  sectionHeader: {
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center'
  },
  sectionTitle: {
    color: theme.cardBlack,
    fontFamily: fonts.bold,
    fontSize: 21,
    letterSpacing: -0.3
  },
  statusBadge: {
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999
  },
  statusText: {
    color: theme.cardBlackSoft,
    fontFamily: fonts.bold,
    fontSize: 12
  },
  cardStage: {
    position: 'relative',
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center'
  },
  heroCard: {
    overflow: 'hidden',
    backgroundColor: theme.cardBlack,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  cardTopRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },
  tipButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0
  },
  darePill: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)'
  },
  darePillText: {
    color: theme.text,
    fontFamily: fonts.bold,
    letterSpacing: 0
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    gap: 12
  },
  titleArea: {
    flex: 1
  },
  heroTitle: {
    color: theme.cardText,
    fontFamily: fonts.display,
    letterSpacing: 0
  },
  underline: {
    marginTop: -2,
    marginLeft: 2
  },
  heroSupport: {
    color: theme.cardMuted,
    fontFamily: fonts.regular,
    marginTop: 9,
    letterSpacing: 0
  },
  dashedDivider: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    opacity: 0.5
  },
  dash: {
    width: 8,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.7)'
  },
  infoGrid: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  infoColumn: {
    flex: 1,
    justifyContent: 'flex-start',
    minWidth: 0
  },
  infoSeparator: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  infoIconSlot: {
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  infoLabel: {
    color: theme.cardMuted,
    fontFamily: fonts.regular,
    marginTop: 3,
    letterSpacing: 0
  },
  infoValue: {
    color: theme.cardText,
    fontFamily: fonts.bold,
    marginTop: 4,
    letterSpacing: 0
  },
  infoSubtext: {
    color: theme.cardMuted,
    fontFamily: fonts.regular,
    marginTop: 1,
    letterSpacing: 0
  },
  actionSection: {
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  actionColumn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%'
  },
  actionMascot: {
    aspectRatio: 1219 / 2031,
    objectFit: 'contain',
    zIndex: 1
  },
  swipeTrack: {
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    backgroundColor: theme.text,
    shadowColor: theme.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 4
  },
  swipeTextWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 58,
    paddingRight: 22,
    pointerEvents: 'none'
  },
  swipeText: {
    color: theme.cardText,
    fontFamily: fonts.bold,
    letterSpacing: 0,
    flexShrink: 1,
    textAlign: 'center'
  },
  swipeHandle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: theme.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  message: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bold,
    marginTop: 18
  },
  closedCard: {
    minHeight: 180,
    marginTop: 36,
    backgroundColor: theme.card,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.06)',
    shadowColor: theme.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2
  },
  closedIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEEEEE'
  },
  closedTitle: { color: theme.text, fontSize: 22, lineHeight: 28, fontFamily: fonts.bold, textAlign: 'center' },
  closedCopy: { color: theme.muted, fontSize: 14, lineHeight: 21, fontFamily: fonts.regular, textAlign: 'center' },
  closedPoints: {
    color: theme.text,
    fontSize: 14,
    fontFamily: fonts.bold,
    backgroundColor: '#EEEEEE',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#111111',
    marginBottom: 8
  },
  modalText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
    width: '100%',
    flexShrink: 1
  },
  modalButton: {
    backgroundColor: '#111111',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center'
  },
  modalButtonText: {
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    fontSize: 16
  },
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  COMPLETED DAY — premium redesign
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  completedWrapper: {
    marginTop: 20,
    gap: 0,
    paddingBottom: 12
  },
  mascotRow: {
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 4,
    zIndex: 2
  },
  mascotImage: {
    height: 96,
    width: 96 * (1219 / 2031),  // ≈ 57.6px — portrait mascot
    aspectRatio: 1219 / 2031
  },

  // ── Main card ────────────────────────────────────────────────────
  completedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 26,
    paddingTop: 36,
    paddingBottom: 28,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.07,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  // Decorative corner dots — top-left cluster
  cornerDotTL: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#DFDFDF'
  },
  cornerDotTL2: {
    position: 'absolute',
    top: 16,
    left: 25,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#E8E8E8'
  },
  // top-right cluster
  cornerDotTR: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#DFDFDF'
  },
  cornerDotTR2: {
    position: 'absolute',
    top: 16,
    right: 25,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#E8E8E8'
  },
  // bottom corners — single dot each
  cornerDotBL: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EBEBEB'
  },
  cornerDotBR: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EBEBEB'
  },

  // ── Double-ring icon ─────────────────────────────────────────────
  iconOuterRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F3F3F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1
  },
  iconMidRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconInnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // ── Text hierarchy ───────────────────────────────────────────────
  completedHeading: {
    color: '#111111',
    fontSize: 23,
    lineHeight: 29,
    fontFamily: fonts.bold,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 10
  },
  completedBody: {
    color: '#787876',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: fonts.regular,
    textAlign: 'center',
    letterSpacing: 0,
    maxWidth: 258
  },
  completedDivider: {
    width: 32,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#ECECEC',
    marginTop: 22,
    marginBottom: 18
  },

  // ── Points pill ──────────────────────────────────────────────────
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F2F2',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: '#EBEBEB'
  },
  pointsPillText: {
    color: '#2A2A2A',
    fontSize: 13,
    lineHeight: 17,
    fontFamily: fonts.bold,
    letterSpacing: 0
  },
  nextDareLabel: {
    color: '#ADADAD',
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: fonts.regular,
    textAlign: 'center',
    letterSpacing: 0.15
  },

  // ── Quote card (with pastel blob) ────────────────────────────────
  quoteCardOuter: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1
  },
  pastelBlobSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  quoteCardInner: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    alignItems: 'center'
  },
  quoteEmoji: {
    fontSize: 11,
    lineHeight: 14,
    color: '#C8B8D8',
    marginBottom: 6,
    letterSpacing: 3
  },
  quoteText: {
    color: '#7A7A78',
    fontSize: 13.5,
    lineHeight: 21,
    fontFamily: fonts.regular,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0
  },

  // ── Tomorrow locked pill button ───────────────────────────────────
  tomorrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 13,
    opacity: 0.58,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
    borderWidth: 1,
    borderColor: '#EEEEEE'
  },
  lockBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEB'
  },
  tomorrowPillText: {
    flex: 1,
    color: '#AAAAAA',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.regular,
    textAlign: 'center',
    letterSpacing: 0.1
  },
  sparkBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEB'
  },
  // ── End completed day redesign ──────────────────────────────────
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  disabled: { opacity: 0.5 }
});
