import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowRight } from 'lucide-react-native';
import { fonts } from '../constants/fonts';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Intro'>;

const introCharacter = require('../../assets/images/Page-1.png');

export function IntroSplashScreen({ navigation }: Props) {
  const { height, width } = useWindowDimensions();
  const compact = height < 720;
  const veryCompact = height < 640;
  const mascotWidth = veryCompact ? 145 : Math.min(165, Math.max(145, width * 0.423));
  const mascotHeight = Math.round(mascotWidth * (230 / 165));

  function openLogin() {
    navigation.replace('Login');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={[styles.content, compact && styles.contentCompact, veryCompact && styles.contentVeryCompact]}>
        <Image source={introCharacter} style={[styles.mascot, compact && styles.mascotCompact, { width: mascotWidth, height: mascotHeight }]} resizeMode="contain" />

        <Text style={[styles.title, compact && styles.titleCompact]}>
          Hey!{'\n'}
          You got this.
        </Text>
        <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
          You don't have to be{'\n'}
          loud to be brave.
        </Text>

        <Pressable accessibilityLabel="Continue" accessibilityRole="button" onPress={openLogin} style={({ pressed }) => [styles.nextButton, compact && styles.nextButtonCompact, pressed && styles.nextPressed]}>
          <ArrowRight color="#FFFFFF" size={34} strokeWidth={2.5} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F3',
    overflow: 'hidden'
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 52
  },
  contentCompact: {
    paddingBottom: 38
  },
  contentVeryCompact: {
    paddingBottom: 26
  },
  mascot: {
    alignSelf: 'center',
    marginTop: 120,
    marginBottom: 75
  },
  mascotCompact: {
    marginTop: 70,
    marginBottom: 52
  },
  title: {
    width: '80%',
    color: '#2A1715',
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontWeight: '400',
    marginBottom: 32
  },
  titleCompact: {
    fontSize: 32,
    lineHeight: 38
  },
  subtitle: {
    width: '78%',
    color: '#6F6F76',
    fontSize: 20,
    lineHeight: 29,
    letterSpacing: -0.2,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontWeight: '400',
    marginBottom: 85
  },
  subtitleCompact: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 58
  },
  nextButton: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: '#2A1715',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    shadowColor: '#2A1715',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  },
  nextButtonCompact: {
    width: 66,
    height: 66
  },
  nextPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9
  }
});
