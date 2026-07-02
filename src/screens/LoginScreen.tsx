import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { fonts } from '../constants/fonts';
import { getBottomSafeSpace } from '../constants/layout';
import type { AuthStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/useAuthStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const mascotImage = require('../../assets/images/page-2.png');

function GoogleLogo() {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </Svg>
  );
}

export function LoginScreen({ navigation }: Props) {
  const { loginWithGoogle, isSigningIn } = useAuthStore();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 720;
  const veryCompact = height < 640;
  const mascotWidth = Math.min(veryCompact ? 112 : compact ? 132 : 155, Math.max(104, width * 0.37));
  const mascotHeight = Math.round(mascotWidth * (2031 / 1219));
  const contentTop = veryCompact ? 54 : compact ? 76 : Math.min(110, Math.max(86, height * 0.12));
  const headingGap = veryCompact ? 16 : compact ? 22 : 30;
  const mascotGap = veryCompact ? 20 : compact ? 32 : 50;
  const buttonGap = veryCompact ? 22 : compact ? 36 : 56;
  const termsGap = veryCompact ? 14 : compact ? 20 : 28;
  const bottomSpace = getBottomSafeSpace(insets.bottom);

  function handleBack() {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.replace('Intro');
  }

  async function handleLogin() {
    try {
      await loginWithGoogle();
    } catch (error) {
      Alert.alert('Could not sign in', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        onPress={handleBack}
        hitSlop={12}
        style={({ pressed }) => [styles.backButton, { top: insets.top + 12 }, pressed && styles.pressed]}
      >
        <ArrowLeft color="#080808" size={28} strokeWidth={2.45} />
      </Pressable>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: contentTop,
            paddingBottom: bottomSpace + (veryCompact ? 18 : 28)
          }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.contentInner}>
          <View style={styles.copyGroup}>
            <View style={styles.titleGroup}>
              <Text style={[styles.title, compact && styles.titleCompact]}>Welcome,</Text>
              <View style={styles.titleLine}>
                <View style={styles.highlightWordWrap}>
                  <Text style={[styles.highlightWord, compact && styles.highlightWordCompact]}>Brave</Text>
                </View>
                <Text style={[styles.title, compact && styles.titleCompact]}> one.</Text>
              </View>
            </View>

            <Text style={[styles.subtitle, { marginTop: headingGap }, compact && styles.subtitleCompact]}>
              Your 100-day journey to{'\n'}
              confidence starts here.
            </Text>
          </View>

          <Image
            source={mascotImage}
            style={[styles.mascot, { width: mascotWidth, height: mascotHeight, marginTop: mascotGap, marginBottom: buttonGap }]}
            resizeMode="contain"
          />

          <View style={styles.actionGroup}>
            <Pressable
              accessibilityLabel="Continue with Google"
              accessibilityRole="button"
              onPress={handleLogin}
              disabled={isSigningIn}
              style={({ pressed }) => [styles.googleButton, isSigningIn && styles.disabled, pressed && !isSigningIn && styles.buttonPressed]}
            >
              <View style={styles.googleBadge}>
                <GoogleLogo />
              </View>
              <View style={styles.googleTextWrap}>
                <Text style={styles.googleText} numberOfLines={1}>
                  {isSigningIn ? 'Opening Google...' : 'Continue with Google'}
                </Text>
              </View>
            </Pressable>

            <Text style={[styles.terms, { marginTop: termsGap }]}>
              By continuing, you agree to our{'\n'}
              <Text style={styles.termsStrong}>Terms & Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F3'
  },
  backButton: {
    position: 'absolute',
    left: 28,
    zIndex: 2,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressed: {
    opacity: 0.65
  },
  scroll: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  contentInner: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 0
  },
  copyGroup: {
    alignItems: 'center'
  },
  title: {
    color: '#111111',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontWeight: '600',
    marginBottom: 0
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 37,
    marginBottom: 0
  },
  titleGroup: {
    alignItems: 'center'
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  highlightWordWrap: {
    backgroundColor: '#C9FF35',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingTop: 1,
    paddingBottom: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  highlightWord: {
    color: '#111111',
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontWeight: '800'
  },
  highlightWordCompact: {
    fontSize: 30,
    lineHeight: 34
  },
  subtitle: {
    color: '#666666',
    fontSize: 17,
    lineHeight: 25,
    letterSpacing: 0,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontWeight: '400'
  },
  subtitleCompact: {
    fontSize: 16,
    lineHeight: 23
  },
  mascot: {
    alignSelf: 'center'
  },
  actionGroup: {
    width: '100%',
    alignItems: 'center'
  },
  googleButton: {
    width: '72%',
    maxWidth: 300,
    minWidth: 250,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#241514',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#241514',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  buttonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.94
  },
  disabled: {
    opacity: 0.6
  },
  googleBadge: {
    position: 'absolute',
    left: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  googleTextWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 62,
    paddingRight: 24
  },
  googleText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontWeight: '600'
  },
  terms: {
    color: '#777777',
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: 0,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontWeight: '400',
    marginTop: 0
  },
  termsStrong: {
    color: '#666666'
  }
});
