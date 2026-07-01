import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { fonts } from '../constants/fonts';
import { clamp } from '../constants/responsive';

const rewardWhite = '#FFFFFF';

interface XPAddAnimationProps {
  totalEarned: number;
  onAnimationComplete: () => void;
}

export function XPAddAnimation({
  totalEarned,
  onAnimationComplete
}: XPAddAnimationProps) {
  const { width, height } = useWindowDimensions();
  const [animatedXP, setAnimatedXP] = useState(0);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const popupSize = clamp(Math.min(width, height) * 0.34, 118, 160);
  const scoreFontSize = clamp(popupSize * 0.26, 32, 42);

  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    let animationFrame: number;
    let mounted = true;

    const animateNum = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - startTime) / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 4);

      if (mounted) setAnimatedXP(Math.round(easeProgress * totalEarned));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateNum);
      }
    };

    animationFrame = requestAnimationFrame(animateNum);

    const animation = Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.delay(duration),
      Animated.delay(900),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]);

    animation.start(() => {
      if (!mounted) return;
      onAnimationComplete();
    });

    return () => {
      mounted = false;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animation.stop();
    };
  }, [totalEarned, onAnimationComplete, opacityAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]} pointerEvents="none">
      <View style={styles.overlay} />
      <View style={[styles.circleContainer, { width: popupSize, height: popupSize }]}>
        {/* Subtle decorative background dots */}
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
        <View style={[styles.dot, styles.dot4]} />
        <View style={[styles.dot, styles.dot5]} />
        <View style={[styles.dot, styles.dot6]} />

        <View style={styles.scoreOverlay}>
          <View style={styles.scoreRow}>
            <Star size={clamp(popupSize * 0.15, 18, 24)} color={rewardWhite} fill={rewardWhite} />
            <Text style={[styles.scoreText, { fontSize: scoreFontSize }]}>+{animatedXP}</Text>
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
