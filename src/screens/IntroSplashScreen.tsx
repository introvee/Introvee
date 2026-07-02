import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowRight } from 'lucide-react-native';
import { fonts } from '../constants/fonts';
import { getBottomSafeSpace } from '../constants/layout';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Intro'>;

const introCharacter = require('../../assets/images/Page-1.png');

export function IntroSplashScreen({ navigation }: Props) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 720;
  const veryCompact = height < 640;
  const mascotWidth = veryCompact ? 145 : Math.min(165, Math.max(145, width * 0.423));
  const mascotHeight = Math.round(mascotWidth * (230 / 165));
  const bottomSpace = getBottomSafeSpace(insets.bottom);
  const topPadding = Math.min(60, Math.max(40, height * 0.065));
  const mascotBottomGap = Math.min(32, Math.max(24, height * 0.038));
  const textGroupGap = Math.min(16, Math.max(10, height * 0.018));
  const buttonTopGap = veryCompact ? Math.min(58, Math.max(48, height * 0.078)) : Math.min(75, Math.max(55, height * 0.083));

  function openLogin() {
    navigation.replace('Login');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View
        style={[
          styles.content,
          compact && styles.contentCompact,
          veryCompact && styles.contentVeryCompact,
          {
            paddingTop: topPadding,
            paddingBottom: bottomSpace + (veryCompact ? 34 : compact ? 44 : 54)
          }
        ]}
      >
        <Image
          source={introCharacter}
          style={[styles.mascot, { width: mascotWidth, height: mascotHeight, marginBottom: mascotBottomGap }]}
          resizeMode="contain"
        />

        <Text style={[styles.title, compact && styles.titleCompact, { marginBottom: textGroupGap }]}>
          Hey!{'\n'}
          You got this.
        </Text>
        <View style={styles.subtitleBlock}>
          <View style={styles.subtitleLine}>
            <Text style={[styles.subtitleText, compact && styles.subtitleTextCompact]}>Become an</Text>
            <View style={styles.highlightBlock}>
              <Text style={[styles.highlightText, compact && styles.highlightTextCompact]}>extrovert</Text>
            </View>
            <Text style={[styles.subtitleText, compact && styles.subtitleTextCompact]}>in 100 days</Text>
          </View>
        </View>

        <Pressable
          accessibilityLabel="Continue"
          accessibilityRole="button"
          onPress={openLogin}
          style={({ pressed }) => [styles.nextButton, compact && styles.nextButtonCompact, { marginTop: buttonTopGap }, pressed && styles.nextPressed]}
        >
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
    alignSelf: 'center'
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
    marginBottom: 14
  },
  titleCompact: {
    fontSize: 32,
    lineHeight: 38
  },
  subtitleBlock: {
    width: '86%',
    alignItems: 'center',
    gap: 8
  },
  subtitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    flexWrap: 'wrap'
  },
  subtitleText: {
    color: '#2A1715',
    fontSize: 20,
    lineHeight: 27,
    letterSpacing: 0,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontWeight: '700'
  },
  subtitleTextCompact: {
    fontSize: 18,
    lineHeight: 25
  },
  highlightBlock: {
    backgroundColor: '#C9FF35',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center'
  },
  highlightText: {
    color: '#111111',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: 0,
    fontFamily: fonts.bold,
    fontWeight: '800'
  },
  highlightTextCompact: {
    fontSize: 18,
    lineHeight: 23
  },
  nextButton: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: '#2A1715',
    alignItems: 'center',
    justifyContent: 'center',
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
