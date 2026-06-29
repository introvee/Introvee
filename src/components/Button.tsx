import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success';
  disabled?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = 'primary', disabled, icon, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style
      ]}
    >
      {icon}
      <Text style={[styles.text, variant !== 'success' && styles.darkText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 14,
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
  text: { color: colors.card, fontSize: 16, fontFamily: fonts.bold },
  darkText: { color: colors.text }
});
