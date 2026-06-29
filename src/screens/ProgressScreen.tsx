import { useEffect, useState } from 'react';
import {
  Image,
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
import { getBadgeCount } from '../services/progressService';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';

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

// ── Data generation for 100 days ──────────────────────────────────────────────
const LEVEL_TITLES = [
  'Tiny Starts',
  'Growing Braver',
  'Soft Confidence',
  'Small Talk Mode',
  'Comfort Breaker',
  'Voice Unlocked',
  'Social Warm-Up',
  'Brave Interactions',
  'Showing Up',
  'Conversation Builder',
  'Fear Less',
  'Friendly Energy',
  'Open Circle',
  'Confident Moves',
  'People Ready',
  'Social Spark',
  'Bold Presence',
  'Extrovert Mode',
  'Fully Showing Up',
  'Brave New You'
];

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
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const [badgeCount, setBadgeCount] = useState(0);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    getBadgeCount(user.id).then(setBadgeCount).catch(() => setBadgeCount(0));
  }, [user?.id]);

  // Set default expanded level once profile loads
  useEffect(() => {
    if (profile && expandedLevel === null) {
      setExpandedLevel(profile.current_level);
    }
  }, [profile, expandedLevel]);

  if (!profile) return null;

  const completedLevels = Math.max(profile.current_level - 1, 0);
  const completedStages = completedLevels * 5 + Math.max(profile.current_stage - 1, 0);
  const progressPct = Math.min(Math.round((completedStages / 100) * 100), 99);

  const hPad = width < 375 ? 16 : 20;
  const ringSize = width < 375 ? 100 : 116;

  const stats = [
    { icon: <BarChart2 size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} />, value: profile.current_level, label: 'Level' },
    { icon: <Flag size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} />, value: `${profile.current_stage} / 5`, label: 'Stage' },
    { icon: <Calendar size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} />, value: profile.current_day, label: 'Days' },
    { icon: <Flame size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} />, value: profile.streak_count, label: 'Streak' },
  ];

  const sections = LEVEL_TITLES.map((title, levelIndex) => {
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
      title: `Level ${levelNumber} · ${title}`,
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
      <View style={[s.topContent, { paddingHorizontal: hPad }]}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerGreeting}>Hi {profile.name || 'Alex'} 👋</Text>
          </View>
        </View>

        {/* Title row */}
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Progress</Text>
          <View style={s.analyticsBtn}>
            <BarChart2 size={15} color={C.text} strokeWidth={1.9} />
          </View>
        </View>

        {/* Stats card */}
        <View style={s.statsCard}>
          {stats.map((stat, i) => (
            <View key={stat.label} style={[s.statCol, i < stats.length - 1 && s.statColBorder]}>
              <View style={s.statIcon}>{stat.icon}</View>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Progress card */}
        <View style={s.progressCard}>
          <View style={s.ringWrap}>
            <CircularProgress percent={progressPct} size={ringSize} />
            <Text style={[s.ringPct, { fontSize: ringSize * 0.21 }]} pointerEvents="none">
              {progressPct}
              <Text style={[s.ringPctSuffix, { fontSize: ringSize * 0.13 }]}>%</Text>
            </Text>
          </View>
          <View style={s.progressTextBlock}>
            <Text style={s.motiveCopy}>Confidence Level</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Your Path</Text>
      </View>

      {/* ── Scrollable Path Container (Accordion) ──────────────── */}
      <View style={[s.pathContainerWrapper, { marginHorizontal: hPad, paddingBottom: insets.bottom + 100 }]}>
        <View style={s.pathContainer}>
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={s.listContent}
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
                  <Text style={[s.levelTitle, !section.isCompleted && !section.isCurrent && s.levelTitleMuted]}>
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
    paddingBottom: 10,
  },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flex: 1 },
  headerGreeting: { color: C.sub, fontSize: 18, lineHeight: 24, fontFamily: fonts.regular, marginBottom: 2 },
  
  // Title row
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { color: C.text, fontSize: 20, lineHeight: 26, fontFamily: fonts.bold, fontWeight: '700', letterSpacing: -0.2 },
  analyticsBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center', shadowColor: C.shadow, shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },

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
  sectionTitle: { color: C.text, fontSize: 18, lineHeight: 24, fontFamily: fonts.bold, fontWeight: '700', letterSpacing: -0.2, marginTop: 4, marginBottom: 2 },

  // Path Container
  pathContainerWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  pathContainer: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 24,
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
    padding: 16,
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
  },
  levelHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
});
