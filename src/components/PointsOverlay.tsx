import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePointsAnimationStore, PointAnimation } from '../store/usePointsAnimationStore';
import { GlobalPointsBadge } from './GlobalPointsBadge';
import { fonts } from '../constants/fonts';

const { width } = Dimensions.get('window');

function FlyingPoint({ animation }: { animation: PointAnimation }) {
  const { removeAnimation, triggerBadgePop } = usePointsAnimationStore();
  const insets = useSafeAreaInsets();

  // Destination coordinates (roughly where the badge is)
  const destX = width - 60;
  const destY = insets.top + 20;

  const translateX = useRef(new Animated.Value(animation.startX)).current;
  const translateY = useRef(new Animated.Value(animation.startY)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    let mounted = true;
    // Initial pop in
    const popInAnimation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true
      })
    ]);
    popInAnimation.start();

    // Fly to badge
    const flyAnimation = Animated.sequence([
      Animated.delay(600), // hold for a moment
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: destX,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(translateY, {
          toValue: destY,
          duration: 700,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(scale, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true
        })
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true
      })
    ]);
    flyAnimation.start(() => {
      if (!mounted) return;
      triggerBadgePop();
      removeAnimation(animation.id);
    });

    return () => {
      mounted = false;
      popInAnimation.stop();
      flyAnimation.stop();
    };
  }, [animation.id, destX, destY, opacity, removeAnimation, scale, translateX, translateY, triggerBadgePop]);

  return (
    <Animated.View
      style={[
        styles.flyingContainer,
        {
          transform: [
            { translateX },
            { translateY },
            { scale }
          ],
          opacity
        }
      ]}
    >
      <Text style={styles.flyingText}>+{animation.amount}</Text>
    </Animated.View>
  );
}

export function PointsOverlay() {
  const animations = usePointsAnimationStore((state) => state.animations);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <GlobalPointsBadge />
      {animations.map((anim) => (
        <FlyingPoint key={anim.id} animation={anim} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flyingContainer: {
    position: 'absolute',
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.32)',
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 9999
  },
  flyingText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: 0.5
  }
});
