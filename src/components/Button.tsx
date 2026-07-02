import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { clamp, moderateScale } from '../constants/responsive';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success';
  disabled?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = 'primary', disabled, icon, style }: Props) {
  const { width, height } = useWindowDimensions();
  const minHeight = clamp(height * 0.064, 48, 54);
  const fontSize = clamp(moderateScale(16, width, 0.35), 15, 17);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { minHeight, paddingHorizontal: clamp(width * 0.05, 16, 22) },
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style
      ]}
    >
      {icon}
      <Text style={[styles.text, { fontSize }, variant !== 'success' && styles.darkText]} numberOfLines={2} adjustsFontSizeToFit>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20
  },
  primary: { backgroundColor: colors.primary },
  success: { backgroundColor: colors.green },
  secondary: { backgroundColor: colors.lavender },
  ghost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  text: { color: colors.card, fontSize: 16, fontFamily: fonts.bold, textAlign: 'center' },
  darkText: { color: colors.text }
});
