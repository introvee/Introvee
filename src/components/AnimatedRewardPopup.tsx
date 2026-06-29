import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Flame, Star } from 'lucide-react-native';
import { fonts } from '../constants/fonts';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const lime = '#C9FF35';

interface AnimatedRewardPopupProps {
  basePoints: number;
  timingBonus: number;
  levelBonus?: number;
  shareBonusAdded?: boolean;
  totalPoints: number;
  streakCount: number;
  onAnimationComplete: () => void;
}

export function AnimatedRewardPopup({
  basePoints,
  timingBonus,
  levelBonus = 0,
  shareBonusAdded = false,
  totalPoints,
  streakCount,
  onAnimationComplete
}: AnimatedRewardPopupProps) {
  const pointsEarnedToday = basePoints + timingBonus + levelBonus + (shareBonusAdded ? 25 : 0);

  const [animatedXP, setAnimatedXP] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const ringProgress = useRef(new Animated.Value(0)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsTranslateY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(10)).current;

  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    const duration = 1600;
    const startTime = Date.now();
    let animationFrame: number;

    const animateNum = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - startTime) / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 4);

      setAnimatedXP(Math.round(easeProgress * pointsEarnedToday));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateNum);
      }
    };

    animationFrame = requestAnimationFrame(animateNum);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true
        })
      ]),
      Animated.timing(ringProgress, {
        toValue: 1,
        duration: duration - 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false
      }),
      Animated.parallel([
        Animated.timing(cardsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(cardsTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true
        })
      ])
    ]).start(() => {
      setIsDone(true);
      onAnimationComplete();
    });

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [pointsEarnedToday, onAnimationComplete, ringProgress, cardsOpacity, cardsTranslateY, titleOpacity, titleTranslateY]);

  const strokeDashoffset = ringProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0]
  });

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.header, { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }]}>
        <View style={styles.iconWrap}>
          <Star size={16} color="#000" fill="#000" />
        </View>
        <Text style={styles.title}>Reward Summary</Text>
      </Animated.View>

      <View style={styles.circleContainer}>
        {/* Subtle decorative background dots */}
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
        <View style={[styles.dot, styles.dot4]} />
        <View style={[styles.dot, styles.dot5]} />
        <View style={[styles.dot, styles.dot6]} />

        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F0F0F0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Animated Progress Ring */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={lime}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.xpTextContainer}>
          <Text style={styles.xpAmount}>+{animatedXP}</Text>
          <Text style={styles.xpLabel}>XP</Text>
        </View>
      </View>

      <Text style={styles.earnedLabel}>XP earned today</Text>

      <Animated.View
        style={[
          styles.breakdownContainer,
          { opacity: cardsOpacity, transform: [{ translateY: cardsTranslateY }] }
        ]}
      >
        {streakCount > 0 && (
          <View style={styles.streakBox}>
            <Flame size={16} color="#008A27" />
            <Text style={styles.streakText}>{streakCount} Day Streak Active!</Text>
          </View>
        )}

        {isDone && (
          <Text style={styles.successMessage}>Great job! XP added.</Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    // @ts-ignore
    backdropFilter: 'blur(16px)'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24
  },
  iconWrap: {
    backgroundColor: lime,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#111111'
  },
  circleContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  xpTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4
  },
  xpAmount: {
    fontFamily: fonts.bold,
    fontSize: 42,
    color: '#111111',
    lineHeight: 48
  },
  xpLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#8C8B88',
    marginTop: 18
  },
  earnedLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#8C8B88',
    marginBottom: 20
  },
  breakdownContainer: {
    width: '100%',
    alignItems: 'center'
  },
  streakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 4
  },
  streakText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#008A27'
  },
  successMessage: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#000',
    marginTop: 16,
    marginBottom: -8, // compensate for padding bottom
    textAlign: 'center'
  },
  dot: {
    position: 'absolute',
    borderRadius: 999
  },
  dot1: { width: 8, height: 8, backgroundColor: '#FF5E5E', top: -5, right: 10 },
  dot2: { width: 6, height: 6, backgroundColor: '#4287f5', bottom: 10, left: -5 },
  dot3: { width: 10, height: 10, backgroundColor: lime, top: 40, left: -15 },
  dot4: { width: 7, height: 7, backgroundColor: '#B13CFF', bottom: 20, right: -10 },
  dot5: { width: 5, height: 5, backgroundColor: '#FF7A1A', top: 10, left: 30 },
  dot6: { width: 9, height: 9, backgroundColor: '#FFD700', bottom: -10, right: 40 }
});
