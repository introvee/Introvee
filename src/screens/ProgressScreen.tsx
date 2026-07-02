import { useEffect, useState } from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  BarChart2,
  Calendar,
  ChevronRight,
  ChevronDown,
  Flame,
  Flag,
  Lock,
  Check,
  Star,
} from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../constants/fonts';
import { getTabBarBottomOffset, TAB_BAR_BASE_HEIGHT } from '../constants/layout';
import { getLevelTitle } from '../constants/levelTitles';
import { clamp, getResponsivePageMetrics } from '../constants/responsive';
import { getCompletedDareCount } from '../services/dareService';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { getCompletedDaresFromProgress, getConfidencePercent } from '../utils/progressStats';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#F5F5F3',
  white: '#FFFFFF',
  dark: '#1C1C1E',
  text: '#111111',
  sub: '#666666',
  muted: '#999999',
  shadow: '#000000',
  border: '#E8E8E8',
};

const sampleTitles: Record<number, string> = {
  1: 'Start a chat',
  2: 'Daily reflection',
  3: 'Say yes to invite',
  4: 'Ask one question',
  5: 'Share your thought',
  6: 'Speak first',
  7: 'Give a compliment',
  8: 'Join a group chat',
  9: 'Call instead of text',
  10: 'Small intro'
};

// ── Circular progress ring ─────────────────────────────────────────────────────
function CircularProgress({ percent, size }: { percent: number; size: number }) {
  const strokeWidth = size * 0.095;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const center = size / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke="#E0E0E0"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress arc */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke="#1C1C1E"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        originX={center}
        originY={center}
      />
    </Svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function ProgressScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const [completedDareCount, setCompletedDareCount] = useState(0);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [hasInitializedExpandedLevel, setHasInitializedExpandedLevel] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getCompletedDareCount(user.id)
      .then((completed) => {
        if (active) setCompletedDareCount(completed);
      })
      .catch(() => {
        if (active) setCompletedDareCount(0);
      });
    return () => {
      active = false;
    };
  }, [user?.id, profile?.current_level, profile?.current_stage, profile?.current_day]);

  // Set default expanded level once profile loads
  useEffect(() => {
    if (profile && !hasInitializedExpandedLevel) {
      setExpandedLevel(profile.current_level);
      setHasInitializedExpandedLevel(true);
    }
  }, [profile, hasInitializedExpandedLevel]);

  if (!profile) return null;

  const completedDares = getCompletedDaresFromProgress(profile, completedDareCount);
  const progressPct = getConfidencePercent(completedDares);

  const metrics = getResponsivePageMetrics(width, height);
  const hPad = metrics.horizontalPadding;
  const compact = width < 390 || height < 780;
  const veryCompact = height < 760;
  const ringSize = clamp(width * (veryCompact ? 0.2 : compact ? 0.22 : 0.28), veryCompact ? 70 : compact ? 78 : 100, width >= 768 ? 132 : 116);
  const topGap = veryCompact ? 7 : compact ? 9 : 16;
  const tabBarVisibleReserve = TAB_BAR_BASE_HEIGHT + getTabBarBottomOffset(insets.bottom) + 8;
  const stats = [
    { icon: <BarChart2 size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} />, value: profile.current_level, label: 'Level' },
    { icon: <Flag size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} />, value: `${profile.current_stage} / 5`, label: 'Stage' },
    { icon: <Calendar size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} />, value: profile.current_day, label: 'Days' },
    { icon: <Flame size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} />, value: profile.streak_count, label: 'Streak' },
  ];

  const sections = Array.from({ length: 20 }).map((_, levelIndex) => {
    const levelNumber = levelIndex + 1;
    const isLevelCompleted = profile.current_level > levelNumber;
    const isLevelCurrent = profile.current_level === levelNumber;
    
    // Check if this level is currently expanded
    const isExpanded = expandedLevel === levelNumber;

    // Only render data if the level is expanded
    const data = isExpanded 
      ? Array.from({ length: 5 }).map((_, stageIndex) => {
          const stageNumber = stageIndex + 1;
          const dayNumber = levelIndex * 5 + stageNumber;
          const dayString = dayNumber < 10 ? `0${dayNumber}` : `${dayNumber}`;
          
          let state = 'next';
          if (profile.current_level > levelNumber || (profile.current_level === levelNumber && profile.current_stage > stageNumber)) {
            state = 'done';
          } else if (profile.current_level === levelNumber && profile.current_stage === stageNumber) {
            state = 'current';
          }
          
          return {
            id: `day-${dayNumber}`,
            dayString,
            state,
            title: sampleTitles[dayNumber] || `Stage Challenge`,
            isFirst: stageIndex === 0,
            isLast: stageIndex === 4,
          };
        })
      : [];

    return {
      levelNumber,
      title: getLevelTitle(levelNumber),
      isCompleted: isLevelCompleted,
      isCurrent: isLevelCurrent,
      isExpanded,
      data,
    };
  });

  const handleToggleLevel = (levelNumber: number) => {
    setExpandedLevel((prev) => (prev === levelNumber ? null : levelNumber));
  };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* ── Fixed Top Content ────────────────────────────────── */}
      <View style={[s.topContent, { paddingHorizontal: hPad, gap: topGap, maxWidth: metrics.maxWidth, alignSelf: 'center', width: '100%', paddingTop: veryCompact ? 8 : compact ? 10 : 14 }]}>
        {/* Title row */}
        <View style={s.titleRow}>
          <Text style={[s.pageTitle, { fontSize: metrics.headerTitleSize }]}>Progress</Text>
        </View>

        {/* Stats card */}
        <View style={[s.statsCard, { paddingVertical: veryCompact ? 10 : compact ? 12 : 18 }]}>
          {stats.map((stat, i) => (
            <View key={stat.label} style={[s.statCol, i < stats.length - 1 && s.statColBorder]}>
              <View style={s.statIcon}>{stat.icon}</View>
              <Text style={[s.statValue, { fontSize: clamp(width * 0.052, 18, 21) }]} numberOfLines={1} adjustsFontSizeToFit>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Progress card */}
        <View style={[s.progressCard, { paddingHorizontal: veryCompact ? 12 : compact ? 14 : 20, paddingVertical: veryCompact ? 10 : compact ? 14 : 24 }]}>
          <View style={s.ringWrap}>
            <CircularProgress percent={progressPct} size={ringSize} />
            <Text style={[s.ringPct, { fontSize: ringSize * 0.21 }]} pointerEvents="none">
              {progressPct}
              <Text style={[s.ringPctSuffix, { fontSize: ringSize * 0.13 }]}>%</Text>
            </Text>
          </View>
          <View style={[s.progressTextBlock, { paddingLeft: veryCompact ? 16 : 22 }]}>
            <Text style={[s.motiveCopy, { fontSize: clamp(width * 0.05, 18, 24), lineHeight: clamp(width * 0.064, 24, 30) }]} numberOfLines={2} adjustsFontSizeToFit>
              Confidence Level
            </Text>
          </View>
        </View>

      </View>

      {/* ── Path Section ───────────────────────────────────────── */}
      <View
        style={[
          s.pathContainerWrapper,
          {
            paddingBottom: tabBarVisibleReserve,
            width: Math.min(width - hPad * 2, metrics.maxWidth),
            alignSelf: 'center',
          },
        ]}
      >
        <Text style={[s.sectionTitle, { fontSize: clamp(width * 0.046, 17, 19), marginBottom: veryCompact ? 8 : 12 }]}>Your Path</Text>

        {/* ── Scrollable Level List Card (Accordion) ───────────── */}
        <View style={s.pathContainer}>
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={[
              s.listContent,
              {
                paddingHorizontal: compact ? 14 : 18,
                paddingTop: veryCompact ? 10 : compact ? 12 : 16,
                paddingBottom: compact ? 18 : 24
              }
            ]}
            renderSectionHeader={({ section }) => (
              <Pressable 
                style={[
                  s.levelHeader, 
                  section.isExpanded && s.levelHeaderExpanded,
                  !section.isExpanded && section.isCurrent && s.levelHeaderCurrentOutline
                ]}
                onPress={() => handleToggleLevel(section.levelNumber)}
              >
                <View style={s.levelHeaderLeft}>
                  <Text
                    style={[s.levelNumber, !section.isCompleted && !section.isCurrent && s.levelTitleMuted]}
                    numberOfLines={1}
                  >
                    Level {section.levelNumber}
                  </Text>
                  <Text
                    style={[s.levelTitle, !section.isCompleted && !section.isCurrent && s.levelTitleMuted]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {section.title}
                  </Text>
                  
                  {section.isCompleted ? (
                    <Text style={s.levelStatusMuted}>5/5 stages</Text>
                  ) : section.isCurrent ? (
                    <View style={s.inProgressPill}>
                      <Text style={s.inProgressText}>In Progress</Text>
                    </View>
                  ) : (
                    <Text style={s.levelStatusMuted}>0/5 stages</Text>
                  )}
                </View>

                <View style={s.levelHeaderRight}>
                  {section.isCompleted && (
                    <View style={s.levelBadge}>
                      <Check size={10} color={C.white} strokeWidth={3} />
                    </View>
                  )}
                  {!section.isCompleted && !section.isCurrent && (
                    <Lock size={14} color={C.muted} strokeWidth={1.8} style={{ marginRight: 6 }} />
                  )}
                  {section.isExpanded ? (
                    <ChevronDown size={18} color={C.text} strokeWidth={2} />
                  ) : (
                    <ChevronRight size={18} color={C.sub} strokeWidth={2} />
                  )}
                </View>
              </Pressable>
            )}
            renderItem={({ item, section }) => {
              const isDone = item.state === 'done';
              const isCurrent = item.state === 'current';
              const isNext = item.state === 'next';

              return (
                <View style={s.timelineRow}>
                  {/* Left connector */}
                  <View style={s.timelineLeft}>
                    {!item.isFirst ? <View style={s.timelineLineTop} /> : <View style={s.timelineLineTopHidden} />}
                    <View style={[
                      s.timelineDot,
                      isDone && s.dotDone,
                      isCurrent && s.dotCurrent,
                      isNext && s.dotNext,
                    ]}>
                      {isDone && <Check size={10} color="#FFFFFF" strokeWidth={2.8} />}
                    </View>
                    {!item.isLast ? <View style={s.timelineLineBottom} /> : <View style={s.timelineLineBottomHidden} />}
                  </View>

                  {/* Card (Non-clickable View) */}
                  <View style={[
                    s.timelineCard,
                    isCurrent && s.timelineCardActive,
                    isNext && s.timelineCardNext,
                  ]}>
                    <View style={s.timelineCardInner}>
                      <View style={s.timelineTextBlock}>
                        <Text style={[s.timelineState, isNext && s.timelineStateMuted]}>
                          Day {item.dayString} · {isCurrent ? 'Current' : isDone ? 'Done' : 'Locked'}
                        </Text>
                        <Text style={[s.timelineLabel, isNext && s.timelineLabelMuted]}>
                          {item.title}
                        </Text>
                      </View>
                      <View style={s.timelineIconSlot}>
                        {isCurrent && <ChevronRight size={16} color={C.text} strokeWidth={2} />}
                        {isDone && <Star size={15} color={C.sub} strokeWidth={1.8} />}
                        {isNext && <Lock size={14} color={C.muted} strokeWidth={1.8} />}
                      </View>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </View>

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  
  // Fixed top content
  topContent: {
    paddingTop: 14,
    gap: 16,
    paddingBottom: 0,
  },
  
  // Title row
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { color: C.text, fontSize: 20, lineHeight: 26, fontFamily: fonts.bold, fontWeight: '700', letterSpacing: -0.2 },

  // Stats card
  statsCard: { backgroundColor: C.dark, borderRadius: 18, flexDirection: 'row', paddingVertical: 18, shadowColor: C.shadow, shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  statCol: { flex: 1, alignItems: 'center', gap: 5 },
  statColBorder: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: 'rgba(255,255,255,0.12)' },
  statIcon: { marginBottom: 2 },
  statValue: { color: '#FFFFFF', fontSize: 20, lineHeight: 25, fontFamily: fonts.bold, fontWeight: '700', letterSpacing: -0.3 },
  statLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 14, fontFamily: fonts.regular },

  // Progress card
  progressCard: { backgroundColor: C.white, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 24, flexDirection: 'row', alignItems: 'center', shadowColor: C.shadow, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  ringWrap: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ringPct: { position: 'absolute', color: C.text, fontFamily: fonts.bold, fontWeight: '700', letterSpacing: -0.5 },
  ringPctSuffix: { color: C.sub, fontFamily: fonts.regular },
  progressTextBlock: { flex: 1, paddingLeft: 22 },
  keepGoing: { color: C.muted, fontSize: 12, lineHeight: 16, fontFamily: fonts.regular, marginBottom: 6 },
  motiveCopy: { color: C.text, fontSize: 22, lineHeight: 28, fontFamily: fonts.bold, fontWeight: '700', letterSpacing: -0.5 },

  // Section title
  sectionTitle: { color: C.text, fontSize: 18, lineHeight: 24, fontFamily: fonts.bold, fontWeight: '700', letterSpacing: -0.2, marginBottom: 12 },

  // Path Container
  pathContainerWrapper: {
    flex: 1,
    marginTop: 10,
  },
  pathContainer: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: 'hidden',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  // Level headers (Accordion)
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  levelHeaderExpanded: {
    backgroundColor: '#F8F8F8',
    borderColor: C.border,
  },
  levelHeaderCurrentOutline: {
    borderColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
  },
  levelHeaderLeft: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  levelHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  levelNumber: {
    color: C.sub,
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fonts.regular,
  },
  levelTitle: {
    color: C.text,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  levelTitleMuted: {
    color: C.muted,
  },
  levelBadge: {
    backgroundColor: C.dark,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  levelStatusMuted: {
    color: C.muted,
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  inProgressPill: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  inProgressText: {
    color: C.text,
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '600',
  },

  // Timeline Items
  timelineRow: { flexDirection: 'row', alignItems: 'stretch' },
  timelineLeft: { width: 32, alignItems: 'center' },
  timelineLineTop: { width: 2, flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', minHeight: 12 },
  timelineLineTopHidden: { width: 2, flex: 1, minHeight: 12 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#DDDDDD', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(0,0,0,0.05)', marginVertical: 2 },
  dotDone: { backgroundColor: C.dark, borderColor: C.dark },
  dotCurrent: { backgroundColor: 'transparent', borderColor: C.text, borderWidth: 2 },
  dotNext: { backgroundColor: '#F0F0F0', borderColor: 'rgba(0,0,0,0.12)' },
  timelineLineBottom: { width: 2, flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', minHeight: 12 },
  timelineLineBottomHidden: { width: 2, flex: 1, minHeight: 12 },
  timelineCard: { flex: 1, backgroundColor: C.white, borderRadius: 14, marginLeft: 10, marginVertical: 6, shadowColor: C.shadow, shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  timelineCardActive: { shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  timelineCardNext: { opacity: 0.85 },
  timelineCardInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13 },
  timelineTextBlock: { flex: 1 },
  timelineState: { color: C.sub, fontSize: 10, lineHeight: 14, fontFamily: fonts.regular, letterSpacing: 0.1, marginBottom: 2 },
  timelineStateMuted: { color: C.muted },
  timelineLabel: { color: C.text, fontSize: 14, lineHeight: 19, fontFamily: fonts.bold, fontWeight: '600', letterSpacing: -0.1 },
  timelineLabelMuted: { color: C.sub },
  timelineIconSlot: { width: 28, alignItems: 'center', justifyContent: 'center' },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
