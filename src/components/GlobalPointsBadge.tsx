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

  // Sync initial points when profile loads
  useEffect(() => {
    if (profile?.total_points !== undefined && displayPoints === 0) {
      setDisplayPoints(profile.total_points);
    }
  }, [profile?.total_points]);

  // Handle pop animation and update display points
  useEffect(() => {
    if (badgePopTrigger > 0) {
      // Small delay to sync with the end of flying animation
      setTimeout(() => {
        setDisplayPoints(profile?.total_points || 0);
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.15,
            duration: 150,
            useNativeDriver: true
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            tension: 50,
            useNativeDriver: true
          })
        ]).start();
      }, 50);
    }
  }, [badgePopTrigger]);

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
      <Text style={styles.label}>XP</Text>
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
    boxShadow: '0px 4px 8px rgba(0, 138, 39, 0.25)',
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 138, 39, 0.4)'
  },
  iconContainer: {
    backgroundColor: '#00FF41',
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
  },
  label: {
    color: '#00FF41',
    fontSize: 12,
    fontFamily: fonts.bold,
    lineHeight: 18,
    opacity: 0.9
  }
});
