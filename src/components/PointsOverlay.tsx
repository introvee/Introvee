import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GlobalPointsBadge } from './GlobalPointsBadge';

export function PointsOverlay() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <GlobalPointsBadge />
    </View>
  );
}
