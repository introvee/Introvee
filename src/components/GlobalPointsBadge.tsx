import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '../store/useProfileStore';
import { usePointsAnimationStore } from '../store/usePointsAnimationStore';
import { fonts } from '../constants/fonts';

const countDuration = 760;

export function GlobalPointsBadge() {
  const profile = useProfileStore((state) => state.profile);
  const pointsAddedEvent = usePointsAnimationStore((state) => state.pointsAddedEvent);
  const clearPointsAddedEvent = usePointsAnimationStore((state) => state.clearPointsAddedEvent);
  const insets = useSafeAreaInsets();
  
  const scale = useRef(new Animated.Value(1)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleTranslateY = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(0.94)).current;
  const [displayPoints, setDisplayPoints] = useState(profile?.total_points || 0);
  const [bubbleText, setBubbleText] = useState('');
  const lastEventId = useRef<string | null>(null);

  useEffect(() => {
    if (!profile || pointsAddedEvent) return;

    if (displayPoints !== profile.total_points) {
      setDisplayPoints(profile.total_points);
    }
  }, [displayPoints, pointsAddedEvent, profile]);

  useEffect(() => {
    if (!profile || !pointsAddedEvent || lastEventId.current === pointsAddedEvent.id) return;

    lastEventId.current = pointsAddedEvent.id;
    const targetPoints = pointsAddedEvent.targetTotal ?? profile.total_points;
    const startPoints = Math.max(0, targetPoints - pointsAddedEvent.amount);
    const startedAt = Date.now();
    let animationFrame: number | null = null;
    let bounceAnimation: Animated.CompositeAnimation | null = null;
    let bubbleAnimation: Animated.CompositeAnimation | null = null;
    let mounted = true;

    setBubbleText(`+${pointsAddedEvent.amount}`);
    bubbleOpacity.setValue(0);
    bubbleTranslateY.setValue(0);
    bubbleScale.setValue(0.94);

    const animateCount = () => {
      const progress = Math.min((Date.now() - startedAt) / countDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextPoints = Math.round(startPoints + (targetPoints - startPoints) * eased);

      if (mounted) setDisplayPoints(nextPoints);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateCount);
        return;
      }

      bounceAnimation = Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true
        })
      ]);

      bubbleAnimation = Animated.sequence([
        Animated.parallel([
          Animated.timing(bubbleOpacity, {
            toValue: 1,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(bubbleTranslateY, {
            toValue: -5,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          }),
          Animated.spring(bubbleScale, {
            toValue: 1,
            friction: 7,
            tension: 120,
            useNativeDriver: true
          })
        ]),
        Animated.delay(640),
        Animated.parallel([
          Animated.timing(bubbleOpacity, {
            toValue: 0,
            duration: 220,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(bubbleTranslateY, {
            toValue: -12,
            duration: 220,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          })
        ])
      ]);

      bounceAnimation.start();
      bubbleAnimation.start(() => clearPointsAddedEvent(pointsAddedEvent.id));
    };

    animationFrame = requestAnimationFrame(animateCount);

    return () => {
      mounted = false;
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      bounceAnimation?.stop();
      bubbleAnimation?.stop();
    };
  }, [bubbleOpacity, bubbleScale, bubbleTranslateY, clearPointsAddedEvent, pointsAddedEvent, profile, scale]);

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
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bubble,
          {
            opacity: bubbleOpacity,
            transform: [{ translateY: bubbleTranslateY }, { scale: bubbleScale }]
          }
        ]}
      >
        <Text style={styles.bubbleText}>{bubbleText}</Text>
      </Animated.View>
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
    borderColor: 'rgba(255, 255, 255, 0.28)',
    zIndex: 20
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
    letterSpacing: 0
  },
  bubble: {
    position: 'absolute',
    top: -22,
    right: 8,
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(17, 17, 17, 0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)'
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 13,
    fontFamily: fonts.bold,
    letterSpacing: 0
  }
});
