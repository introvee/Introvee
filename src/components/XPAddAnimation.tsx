import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { fonts } from '../constants/fonts';
import { clamp } from '../constants/responsive';

const rewardWhite = '#FFFFFF';
const rewardGreen = '#B7FF2A';

interface XPAddAnimationProps {
  totalEarned: number;
  onAnimationComplete: () => void;
}

export function XPAddAnimation({ totalEarned, onAnimationComplete }: XPAddAnimationProps) {
  const { width, height } = useWindowDimensions();
  const [animatedXP, setAnimatedXP] = useState(0);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const translateYAnim = useRef(new Animated.Value(10)).current;
  const scoreFontSize = clamp(Math.min(width, height) * 0.13, 46, 66);
  const labelFontSize = clamp(scoreFontSize * 0.22, 11, 15);

  useEffect(() => {
    const rollDuration = 1050;
    const startTime = Date.now();
    let animationFrame: number;
    let mounted = true;

    const animateNum = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - startTime) / rollDuration);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const digitCount = Math.max(2, String(Math.max(0, totalEarned)).length);

      if (mounted) {
        if (progress < 0.72) {
          const min = digitCount > 1 ? 10 ** (digitCount - 1) : 0;
          const max = 10 ** digitCount - 1;
          setAnimatedXP(Math.floor(min + Math.random() * (max - min + 1)));
        } else {
          setAnimatedXP(Math.round(easeProgress * totalEarned));
        }
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateNum);
      } else if (mounted) {
        setAnimatedXP(totalEarned);
      }
    };

    animationFrame = requestAnimationFrame(animateNum);

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 90,
          useNativeDriver: true
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true
        })
      ]),
      Animated.delay(rollDuration + 650),
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.04,
          duration: 260,
          useNativeDriver: true
        }),
        Animated.timing(translateYAnim, {
          toValue: -8,
          duration: 260,
          useNativeDriver: true
        })
      ])
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
  }, [totalEarned, onAnimationComplete, opacityAnim, scaleAnim, translateYAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }]
        }
      ]}
      pointerEvents="none"
    >
      <View style={styles.scoreBlock}>
        <Text style={[styles.scoreText, { fontSize: scoreFontSize, lineHeight: scoreFontSize * 1.02 }]}>
          +{animatedXP}
        </Text>
        <Text style={[styles.labelText, { fontSize: labelFontSize, lineHeight: labelFontSize * 1.25 }]}>points</Text>
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
    zIndex: 999
  },
  scoreBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 136
  },
  scoreText: {
    fontFamily: fonts.bold,
    color: rewardWhite,
    letterSpacing: 0,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.44)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10
  },
  labelText: {
    marginTop: 1,
    fontFamily: fonts.bold,
    color: rewardGreen,
    letterSpacing: 0,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.32)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5
  }
});
