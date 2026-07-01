import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '../store/useProfileStore';
import { usePointsAnimationStore } from '../store/usePointsAnimationStore';
import { fonts } from '../constants/fonts';

export function GlobalPointsBadge() {
  const profile = useProfileStore((state) => state.profile);
  const badgePopTrigger = usePointsAnimationStore((state) => state.badgePopTrigger);
  const insets = useSafeAreaInsets();
  
  const scale = useRef(new Animated.Value(1)).current;
  const [displayPoints, setDisplayPoints] = useState(profile?.total_points || 0);
  const lastSettledPoints = useRef(profile?.total_points || 0);
  const hasLoadedInitialPoints = useRef(profile?.total_points !== undefined);

  useEffect(() => {
    if (profile?.total_points === undefined) return;

    const nextPoints = profile.total_points;
    const previousPoints = lastSettledPoints.current;

    if (!hasLoadedInitialPoints.current) {
      hasLoadedInitialPoints.current = true;
      lastSettledPoints.current = nextPoints;
      setDisplayPoints(nextPoints);
      return;
    }

    if (nextPoints === previousPoints) {
      setDisplayPoints(nextPoints);
      return;
    }

    const duration = 1050;
    const startTime = Date.now();
    let animationFrame: number;
    let mounted = true;
    const digitCount = Math.max(String(Math.max(previousPoints, nextPoints)).length, 2);

    const rollNumber = () => {
      const progress = Math.min(1, (Date.now() - startTime) / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      if (mounted) {
        if (progress < 0.72) {
          const min = digitCount > 1 ? 10 ** (digitCount - 1) : 0;
          const max = 10 ** digitCount - 1;
          setDisplayPoints(Math.floor(min + Math.random() * (max - min + 1)));
        } else {
          setDisplayPoints(Math.round(previousPoints + (nextPoints - previousPoints) * easeProgress));
        }
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(rollNumber);
      } else if (mounted) {
        lastSettledPoints.current = nextPoints;
        setDisplayPoints(nextPoints);
      }
    };

    const popAnimation = Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.14,
        duration: 150,
        useNativeDriver: true
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true
      })
    ]);

    animationFrame = requestAnimationFrame(rollNumber);
    popAnimation.start();

    return () => {
      mounted = false;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      popAnimation.stop();
    };
  }, [profile?.total_points, scale]);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (badgePopTrigger > 0) {
      animation = Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 130,
          useNativeDriver: true
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true
        })
      ]);
      animation.start();
    }
    return () => {
      animation?.stop();
    };
  }, [badgePopTrigger, scale]);

  if (!profile) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 12, transform: [{ scale }] }
      ]}
    >
      <View style={styles.iconContainer}>
        <Star size={12} color="#000" fill="#000" />
      </View>
      <Text style={styles.pointsText}>{displayPoints}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.18)',
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)'
  },
  iconContainer: {
    backgroundColor: '#FFFFFF',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
    lineHeight: 18,
    letterSpacing: 0.5
  }
});
