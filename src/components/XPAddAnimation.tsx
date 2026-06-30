import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { fonts } from '../constants/fonts';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const rewardWhite = '#FFFFFF';

interface XPAddAnimationProps {
  totalEarned: number;
  onAnimationComplete: () => void;
}

export function XPAddAnimation({
  totalEarned,
  onAnimationComplete
}: XPAddAnimationProps) {
  const [animatedXP, setAnimatedXP] = useState(0);
  const ringProgress = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    let animationFrame: number;

    const animateNum = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - startTime) / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 4);

      setAnimatedXP(Math.round(easeProgress * totalEarned));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateNum);
      }
    };

    animationFrame = requestAnimationFrame(animateNum);

    Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(ringProgress, {
        toValue: 1,
        duration: duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false
      }),
      Animated.delay(900),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      onAnimationComplete();
    });

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [totalEarned, onAnimationComplete, ringProgress, opacityAnim]);

  const strokeDashoffset = ringProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0]
  });

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]} pointerEvents="none">
      <View style={styles.overlay} />
      <View style={styles.circleContainer}>
        {/* Subtle decorative background dots */}
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
        <View style={[styles.dot, styles.dot4]} />
        <View style={[styles.dot, styles.dot5]} />
        <View style={[styles.dot, styles.dot6]} />

        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={rewardWhite}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>

        <View style={styles.scoreOverlay}>
          <View style={styles.scoreRow}>
            <Star size={24} color={rewardWhite} fill={rewardWhite} />
            <Text style={styles.scoreText}>+{animatedXP}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  circleContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scoreText: {
    fontFamily: fonts.bold,
    fontSize: 42,
    color: rewardWhite,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: rewardWhite,
    opacity: 0.8,
  },
  dot1: { top: -10, left: 40 },
  dot2: { top: 20, right: -10 },
  dot3: { bottom: 30, right: -15 },
  dot4: { bottom: -5, left: 60 },
  dot5: { bottom: 40, left: -10 },
  dot6: { top: 40, left: -15 },
});
