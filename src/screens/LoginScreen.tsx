import { Alert, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { fonts } from '../constants/fonts';
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
  const compact = height < 720;
  const veryCompact = height < 640;
  const mascotWidth = veryCompact ? 118 : compact ? 136 : Math.min(155, Math.max(146, width * 0.37));
  const mascotHeight = Math.round(mascotWidth * (2031 / 1219));
  const contentTop = veryCompact ? 76 : compact ? 110 : Math.min(135, Math.max(118, height * 0.158));
  const headingGap = veryCompact ? 24 : compact ? 28 : 34;
  const mascotGap = veryCompact ? 34 : compact ? 42 : 58;
  const buttonGap = veryCompact ? 34 : compact ? 48 : 62;
  const termsGap = veryCompact ? 20 : compact ? 24 : 30;

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
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        onPress={handleBack}
        hitSlop={12}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <ArrowLeft color="#080808" size={28} strokeWidth={2.45} />
      </Pressable>

      <View style={[styles.content, { paddingTop: contentTop }, veryCompact && styles.contentVeryCompact]}>
        <View style={styles.copyGroup}>
          <Text style={[styles.title, compact && styles.titleCompact]}>
            Welcome back,{'\n'}
            <Text style={styles.greenWord}>Brave</Text> one.
          </Text>

          <Text style={[styles.subtitle, { marginTop: headingGap }, compact && styles.subtitleCompact]}>
            Your safe space for small{'\n'}
            steps forward.
          </Text>
        </View>

        <Image
          source={mascotImage}
          style={[styles.mascot, { width: mascotWidth, height: mascotHeight, marginTop: mascotGap, marginBottom: buttonGap }]}
          resizeMode="contain"
        />

        <View style={styles.actionGroup}>
          <Pressable
            accessibilityLabel="Sign in with Google"
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
                Sign in with Google
              </Text>
            </View>
          </Pressable>

          <Text style={[styles.terms, { marginTop: termsGap }]}>
            By continuing, you agree to our{'\n'}
            <Text style={styles.termsStrong}>Terms &amp; Privacy Policy</Text>
          </Text>
        </View>
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
  backButton: {
    position: 'absolute',
    top: 28,
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 38
  },
  contentVeryCompact: {
    paddingBottom: 14
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
  greenWord: {
    color: '#5E8F78'
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
    borderRadius: 29,
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
