import type { ReactNode } from 'react';
import { forwardRef } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';

export const Card = forwardRef<View, { children: ReactNode; style?: ViewStyle }>(({ children, style }, ref) => {
  return <View ref={ref} style={[styles.card, style]}>{children}</View>;
});

Card.displayName = 'Card';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#1B1B1B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border
  }
});
