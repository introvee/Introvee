import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { colors } from '../constants/colors';

type Props = {
  type?: 'introvert' | 'brave' | 'celebration' | 'progress' | string | null;
  level?: number;
  size?: number;
};

export function Mascot({ type = 'introvert', level = 1, size = 120 }: Props) {
  const pose = level >= 20 ? 'celebration' : level >= 15 ? 'brave' : level >= 10 ? 'waving' : level >= 5 ? 'smiling' : type;
  const bodyColor = pose === 'celebration' ? colors.softOrange : pose === 'progress' ? colors.softOrange : colors.lavender;

  return (
    <View accessibilityLabel={`${pose} mascot placeholder`}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Circle cx="60" cy="28" r="18" fill="#FFF7D9" stroke={colors.text} strokeWidth="3" />
        <Path d="M48 28 Q52 33 56 28" stroke={colors.text} strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M64 28 Q68 33 72 28" stroke={colors.text} strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M53 38 Q60 43 67 38" stroke={colors.text} strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M42 58 Q60 45 78 58 L74 92 Q60 102 46 92 Z" fill={bodyColor} stroke={colors.text} strokeWidth="3" />
        <SvgText x="60" y="78" textAnchor="middle" fontSize="24" fontWeight="700" fill={colors.primary}>B</SvgText>
        <Line x1="45" y1="63" x2="25" y2={pose === 'waving' || pose === 'celebration' ? 42 : 76} stroke={colors.text} strokeWidth="3" strokeLinecap="round" />
        <Line x1="76" y1="63" x2="96" y2={pose === 'celebration' ? 42 : 76} stroke={colors.text} strokeWidth="3" strokeLinecap="round" />
        <Line x1="54" y1="95" x2="48" y2="112" stroke={colors.text} strokeWidth="3" strokeLinecap="round" />
        <Line x1="66" y1="95" x2="72" y2="112" stroke={colors.text} strokeWidth="3" strokeLinecap="round" />
        {pose === 'celebration' && <Path d="M22 20 L28 30 L17 31 M96 18 L88 28 L101 30" stroke={colors.green} strokeWidth="3" fill="none" strokeLinecap="round" />}
      </Svg>
    </View>
  );
}
