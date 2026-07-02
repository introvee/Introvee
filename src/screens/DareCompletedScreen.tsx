import { forwardRef, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Check,
  Download,
  X
} from 'lucide-react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import type { ViewShotRef } from 'react-native-view-shot';
import { fonts } from '../constants/fonts';
import type { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { awardSharePoints } from '../db/repository';
import { convertDareToCompletionText } from '../utils/dareText';
import { captureScreenAsImage, saveScreenAsImage } from '../utils/downloadScreen';
import { isShareTargetInstalled, shareImageToSocial } from '../utils/socialShare';

type Props = NativeStackScreenProps<RootStackParamList, 'DareCompleted'>;

type SharePosterProps = {
  dareText: string;
  completedTime: string;
  posterWidth: number;
  userImage?: string | null;
  userName?: string | null;
};

const lime = '#C9FF35';
const storyLink = 'https://introvee.com/';
const posterBaseWidth = 350;
const posterBaseHeight = 438;
const posterAspectRatio = posterBaseHeight / posterBaseWidth;
const posterCardPadding = 6;
const posterTitleContentWidth = 257;
const posterTitleContentHeight = 156;
const posterTitleReadableMinFontSize = 19;
const posterTitleEmergencyMinFontSize = 10;
const titleSoftBreak = '\u200B';
const dareShareMessage = `I just completed today’s dare on Introvee. Try this app and start your confidence journey.
${storyLink}`;
const devBypassUserId = '00000000-0000-4000-8000-000000000001';

export function DareCompletedScreen({ navigation, route }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);
  const posterRef = useRef<ViewShotRef>(null);
  const [busyAction, setBusyAction] = useState<'save' | 'whatsapp' | 'instagram' | null>(null);
  const [shareBonusAdded, setShareBonusAdded] = useState(false);
  const responsive = getResponsiveStyles(width, height, insets.top, insets.bottom);

  const rawDareText = route.params.easier ? route.params.dare.easier_title : route.params.dare.title;
  const dareText = useMemo(() => convertDareToCompletionText(rawDareText), [rawDareText]);
  const completedTime = useMemo(() => formatCompletedTime(route.params.elapsedSeconds), [route.params.elapsedSeconds]);

  async function handleShareBonus() {
    if (!user || shareBonusAdded) return;
    if (user.id === devBypassUserId) return;

    try {
      const { pointsAwarded, profile: updatedProfile } = await awardSharePoints(user.id, route.params.dare.id, false);
      if (pointsAwarded > 0) {
        setShareBonusAdded(true);
        if (updatedProfile) setProfile(updatedProfile);
      }
    } catch {
      return;
    }
  }

  async function savePost() {
    setBusyAction('save');
    try {
      await saveScreenAsImage(posterRef.current, 'introvert-dare-complete.png');
      Alert.alert('Saved', 'Post saved successfully');
    } catch (error) {
      Alert.alert('Could not save', getShareErrorMessage(error, 'Unable to save post. Please try again.'));
    } finally {
      setBusyAction(null);
    }
  }

  async function shareToPlatform(target: 'instagram' | 'whatsapp') {
    const platformName = target === 'whatsapp' ? 'WhatsApp' : 'Instagram';
    setBusyAction(target);
    try {
      const canOpenApp = await isShareTargetInstalled(target);

      if (!canOpenApp) {
        showShareAlert(target === 'whatsapp' ? 'WhatsApp is not installed' : 'Instagram is not installed');
        return;
      }

      const uri =
        typeof posterRef.current?.capture === 'function'
          ? await posterRef.current.capture()
          : await captureScreenAsImage(
              posterRef.current,
              target === 'whatsapp' ? 'introvert-dare-whatsapp.png' : 'introvert-dare-instagram.png'
            );

      await shareImageToSocial(target, uri, dareShareMessage);

      await handleShareBonus();
    } catch (error) {
      showShareAlert(`Could not share to ${platformName}`, getShareErrorMessage(error, 'Please try again.'));
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, responsive.content]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close dare complete"
          hitSlop={12}
          onPress={() => navigation.navigate('Main', { screen: 'Journey' })}
          style={({ pressed }) => [styles.closeButton, responsive.closeButton, pressed && styles.pressed]}
        >
          <X color={theme.text} size={responsive.closeIconSize} strokeWidth={2.2} />
        </Pressable>

        <View style={[styles.hero, responsive.hero]}>
          <Text style={[styles.title, responsive.title]} numberOfLines={1} adjustsFontSizeToFit>
            Dare Complete
          </Text>
          <Text style={[styles.subtitle, responsive.subtitle]}>
            You stepped out of your comfort zone.{'\n'}
            <Text style={styles.proudStrong}>Proud of you.</Text> ♡
          </Text>
        </View>

        <View style={[styles.posterShadow, responsive.posterShadow]}>
          <ViewShot
            ref={posterRef}
            options={{
              format: 'png',
              quality: 1,
              result: 'tmpfile'
            }}
            style={styles.posterCapture}
          >
            <SharePoster
              dareText={dareText}
              completedTime={completedTime}
              posterWidth={responsive.posterWidth}
              userImage={profile?.avatar_url}
              userName={profile?.name}
            />
          </ViewShot>
        </View>

        <View style={[styles.actions, responsive.actions]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save Post"
            disabled={busyAction !== null}
            onPress={savePost}
            style={({ pressed }) => [
              styles.shareButton,
              styles.saveButton,
              responsive.actionButton,
              pressed && busyAction === null && styles.primaryPressed,
              busyAction && styles.disabled
            ]}
          >
            {busyAction === 'save' ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Download color="#FFFFFF" size={22} strokeWidth={2.45} />}
            <Text style={styles.saveText}>{busyAction === 'save' ? 'Saving...' : 'Save Post'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="WhatsApp"
            disabled={busyAction !== null}
            onPress={() => shareToPlatform('whatsapp')}
            style={({ pressed }) => [
              styles.shareButton,
              styles.platformButton,
              responsive.actionButton,
              pressed && busyAction === null && styles.secondaryPressed,
              busyAction && styles.disabled
            ]}
          >
            {busyAction === 'whatsapp' ? <ActivityIndicator color="#111111" size="small" /> : <WhatsAppGlyph />}
            <Text style={styles.platformText}>{busyAction === 'whatsapp' ? 'Preparing...' : 'WhatsApp'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Instagram"
            disabled={busyAction !== null}
            onPress={() => shareToPlatform('instagram')}
            style={({ pressed }) => [
              styles.shareButton,
              styles.platformButton,
              responsive.actionButton,
              pressed && busyAction === null && styles.secondaryPressed,
              busyAction && styles.disabled
            ]}
          >
            {busyAction === 'instagram' ? <ActivityIndicator color="#111111" size="small" /> : <InstagramGlyph />}
            <Text style={styles.platformText}>{busyAction === 'instagram' ? 'Preparing...' : 'Instagram'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const SharePoster = forwardRef<View, SharePosterProps>(function SharePoster({ dareText, completedTime, posterWidth, userImage, userName }, ref) {
  const scale = posterWidth / posterBaseWidth;
  const posterHeight = posterWidth * posterAspectRatio;
  const initial = getInitial(userName);
  const highlightedWord = chooseHighlightedWord(dareText);
  const avatarMetrics = getPosterAvatarMetrics(posterWidth, scale);
  const achievementTextStyle = getShareTextStyle(dareText);

  return (
    <View ref={ref} collapsable={false} style={posterStyles.poster}>
      <View
        style={[
          posterStyles.artboard,
          {
            left: (posterWidth - posterBaseWidth) / 2,
            top: (posterHeight - posterBaseHeight) / 2,
            transform: [{ scale }]
          }
        ]}
      >
        <PosterPaper />
        <PosterDoodles />
        <View style={posterStyles.softCircleTop} />
        <View style={posterStyles.softCircleBottom} />
        <View style={posterStyles.socialWinSticker}>
          <Text style={posterStyles.socialWinText}>SOCIAL{'\n'}WIN</Text>
          <Text style={posterStyles.socialWinSpark}>+</Text>
        </View>

        <View style={posterStyles.posterContent}>
          <View style={posterStyles.headerRow}>
            <View style={posterStyles.journeyBlock}>
              <Text style={posterStyles.journeyText} numberOfLines={1} adjustsFontSizeToFit>
                Building Confidence
              </Text>
              <Text style={posterStyles.microText} numberOfLines={1}>
                DARE COMPLETED
              </Text>
            </View>
          </View>

          <View style={[posterStyles.avatarRing, avatarMetrics.ring]}>
            <View style={[posterStyles.avatarFrame, avatarMetrics.frame]}>
              {userImage ? (
                <Image source={{ uri: userImage }} style={posterStyles.avatarImage} resizeMode="cover" />
              ) : (
                <View style={posterStyles.avatarFallback}>
                  <Text style={[posterStyles.avatarInitial, avatarMetrics.initial]}>{initial}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={posterStyles.posterTextFrame}>
            <AchievementTitle text={dareText} highlightedWord={highlightedWord} style={achievementTextStyle} />
          </View>

          <View style={posterStyles.footerBlock}>
            <View style={posterStyles.doneBadge}>
              <Svg pointerEvents="none" style={posterStyles.donePaintStroke} width={184} height={43} viewBox="0 0 184 43">
                <Path
                  d="M11 9 C24 7 47 8 68 7 L139 7 C160 7 174 10 176 17 L177 28 C174 36 157 36 137 35 L47 36 C28 36 12 34 9 27 L8 16 C8 13 9 11 11 9 Z"
                  fill="#111111"
                />
              </Svg>
              <View style={posterStyles.doneIcon}>
                <Check color={lime} size={15} strokeWidth={2.8} />
              </View>
              <Text style={posterStyles.doneText} numberOfLines={1}>
                Done in {completedTime}
              </Text>
            </View>
            <Text style={posterStyles.hashtag}>#DareToGrow</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

function AchievementTitle({ text, highlightedWord, style }: { text: string; highlightedWord: string | null; style: StyleProp<TextStyle> }) {
  const words = text.split(/(\s+)/);

  return (
    <Text
      style={[posterStyles.achievementTitle, style]}
    >
      {words.map((word, index) => {
        const clean = cleanWord(word);
        const key = `${text}-${index}`;
        const wrappedWord = makeLongWordBreakable(word);
        if (highlightedWord && clean === highlightedWord) {
          return (
            <Text key={key} style={posterStyles.highlightWord}>
              {wrappedWord}
            </Text>
          );
        }

        return <Text key={key}>{wrappedWord}</Text>;
      })}
    </Text>
  );
}

function InstagramGlyph() {
  return (
    <Svg width={25} height={25} viewBox="0 0 25 25">
      <Rect x={4} y={4} width={17} height={17} rx={5} fill="none" stroke="#111111" strokeWidth={2.2} />
      <Circle cx={12.5} cy={12.5} r={4} fill="none" stroke="#111111" strokeWidth={2.2} />
      <Circle cx={17.5} cy={7.7} r={1.35} fill="#111111" />
    </Svg>
  );
}

function WhatsAppGlyph() {
  return (
    <Svg width={25} height={25} viewBox="0 0 25 25">
      <Path
        d="M12.3 4.2C7.9 4.2 4.4 7.7 4.4 12c0 1.5.4 2.9 1.2 4.1l-1 4 4.1-1.1c1.1.6 2.4 1 3.7 1 4.3 0 7.8-3.5 7.8-7.8S16.6 4.2 12.3 4.2Z"
        fill="none"
        stroke="#111111"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M9.2 8.7c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.7c.1.3 0 .5-.1.6l-.5.6c.7 1.2 1.6 2.1 2.8 2.8l.7-.7c.2-.2.4-.2.7-.1l1.5.7c.3.1.4.3.4.6v.4c0 .4-.2.7-.6.9-.5.3-1.1.4-1.8.3-2.9-.4-5.9-3.1-6.4-6.1-.1-.7 0-1.3.3-1.8Z"
        fill="#111111"
      />
    </Svg>
  );
}

function PosterPaper() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={posterStyles.paperBase} />
      <View style={posterStyles.paperWashA} />
      <View style={posterStyles.paperWashB} />
      <View style={posterStyles.paperStripA} />
      <View style={posterStyles.paperStripB} />
      <View style={posterStyles.paperNoiseA} />
      <View style={posterStyles.paperNoiseB} />
    </View>
  );
}

function PosterDoodles() {
  return (
    <View pointerEvents="none" style={posterStyles.doodleLayer}>
      <View style={[posterStyles.tapeSticker, posterStyles.tapeStickerTopLeft]}>
        <View style={posterStyles.tapeFiberA} />
        <View style={posterStyles.tapeFiberB} />
      </View>
      <View style={[posterStyles.tapeSticker, posterStyles.tapeStickerBottomRight]}>
        <View style={posterStyles.tapeFiberA} />
        <View style={posterStyles.tapeFiberB} />
      </View>

      <Svg style={posterStyles.crownDoodle} width={38} height={30} viewBox="0 0 48 38">
        <Path d="M6 28 L9 11 L19 22 L25 7 L33 22 L42 12 L40 30 Z" fill="none" stroke="#111111" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={9} cy={10} r={1.8} fill="#C9FF35" stroke="#111111" strokeWidth={1.3} />
        <Circle cx={25} cy={6} r={1.8} fill="#C9FF35" stroke="#111111" strokeWidth={1.3} />
        <Circle cx={42} cy={11} r={1.8} fill="#C9FF35" stroke="#111111" strokeWidth={1.3} />
      </Svg>

      <Svg style={posterStyles.heartDoodle} width={30} height={30} viewBox="0 0 38 38">
        <Path d="M19 31 C9 22 5 16 8 10 C10 6 16 7 19 12 C22 7 29 6 31 11 C34 17 28 24 19 31 Z" fill="none" stroke="#111111" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>

      <Svg style={posterStyles.sparkleDoodleA} width={22} height={22} viewBox="0 0 28 28">
        <Path d="M14 2 L16.5 11.5 L26 14 L16.5 16.5 L14 26 L11.5 16.5 L2 14 L11.5 11.5 Z" fill="none" stroke="#111111" strokeWidth={1.7} strokeLinejoin="round" />
      </Svg>
      <Svg style={posterStyles.sparkleDoodleB} width={18} height={18} viewBox="0 0 22 22">
        <Path d="M11 2 L12.7 9.3 L20 11 L12.7 12.7 L11 20 L9.3 12.7 L2 11 L9.3 9.3 Z" fill="none" stroke="#111111" strokeWidth={1.6} strokeLinejoin="round" />
      </Svg>

      <Svg style={posterStyles.lineDoodleLeft} width={34} height={28} viewBox="0 0 42 34">
        <Line x1={4} y1={8} x2={20} y2={2} stroke="#111111" strokeWidth={2} strokeLinecap="round" />
        <Line x1={5} y1={18} x2={26} y2={14} stroke="#111111" strokeWidth={2} strokeLinecap="round" />
        <Line x1={8} y1={28} x2={36} y2={25} stroke="#111111" strokeWidth={2} strokeLinecap="round" />
      </Svg>
      <View style={posterStyles.limeDot} />
    </View>
  );
}

function formatCompletedTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds} ${seconds === 1 ? 'sec' : 'sec'}`;

  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
}

function getShareErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

function showShareAlert(title: string, message?: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }

  Alert.alert(title, message);
}

function getPosterAvatarMetrics(_posterWidth: number, _scale: number) {
  const frameSize = 96;
  const ringThickness = 6;
  const ringSize = frameSize + ringThickness * 2;
  const initialSize = 40;

  return {
    ring: {
      width: ringSize,
      height: ringSize,
      borderRadius: ringSize / 2,
      borderWidth: ringThickness
    },
    frame: {
      width: frameSize,
      height: frameSize,
      borderRadius: frameSize / 2
    },
    initial: {
      fontSize: initialSize,
      lineHeight: initialSize + 5
    }
  };
}

function getShareTextStyle(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  const characterCount = normalized.length;
  const preferredFontSize = getPreferredShareFontSize(characterCount);
  const fitWidth = posterTitleContentWidth;
  const fitHeight = posterTitleContentHeight;
  let fontSize = posterTitleEmergencyMinFontSize;

  for (let nextSize = preferredFontSize; nextSize >= posterTitleEmergencyMinFontSize; nextSize -= 1) {
    const lineHeightRatio = getShareLineHeightRatio(characterCount, nextSize);
    const lineHeight = nextSize * lineHeightRatio;
    const lineCount = estimateTitleLineCount(normalized, nextSize, fitWidth);

    if (lineCount * lineHeight <= fitHeight) {
      fontSize = nextSize;
      break;
    }
  }

  const lineHeightRatio = getShareLineHeightRatio(characterCount, fontSize);

  return {
    fontSize,
    lineHeight: Math.round(fontSize * lineHeightRatio)
  };
}

function estimateTitleLineCount(value: string, fontSize: number, availableWidth: number) {
  if (!value) return 1;

  const averageSpaceWidth = fontSize * 0.32;
  const words = value.split(/\s+/).filter(Boolean);
  let lines = 1;
  let currentLineWidth = 0;

  for (const word of words) {
    const wordWidth = estimateTitleWordWidth(word, fontSize);
    const spacing = currentLineWidth > 0 ? averageSpaceWidth : 0;

    if (wordWidth > availableWidth) {
      const wrappedWordLines = Math.ceil(wordWidth / availableWidth);
      lines += currentLineWidth > 0 ? wrappedWordLines : wrappedWordLines - 1;
      currentLineWidth = wordWidth % availableWidth;
      continue;
    }

    if (currentLineWidth + spacing + wordWidth > availableWidth) {
      lines += 1;
      currentLineWidth = wordWidth;
    } else {
      currentLineWidth += spacing + wordWidth;
    }
  }

  return lines;
}

function getPreferredShareFontSize(characterCount: number) {
  if (characterCount <= 35) return 34;
  if (characterCount <= 55) return 30;
  if (characterCount <= 75) return 26;
  if (characterCount <= 100) return 22;
  return 19;
}

function getShareLineHeightRatio(characterCount: number, fontSize: number) {
  if (fontSize < posterTitleReadableMinFontSize || characterCount > 100) return 1.02;
  if (characterCount > 75) return 1.05;
  if (characterCount > 55) return 1.08;
  return 1.12;
}

function estimateTitleWordWidth(value: string, fontSize: number) {
  let width = 0;

  for (const character of value) {
    if (/[ilI.,'!:;]/.test(character)) width += 0.28;
    else if (/[mwMW@#%&]/.test(character)) width += 0.78;
    else if (/[A-Z]/.test(character)) width += 0.64;
    else if (/[0-9]/.test(character)) width += 0.54;
    else if (/[-/\\()[\]{}]/.test(character)) width += 0.38;
    else width += 0.53;
  }

  return width * fontSize;
}

function makeLongWordBreakable(value: string) {
  if (/^\s+$/.test(value) || value.length <= 12) return value;
  return value.replace(/(\S{12})(?=\S)/g, `$1${titleSoftBreak}`);
}

function chooseHighlightedWord(value: string) {
  const words = value.split(/\s+/).map(cleanWord).filter(Boolean);
  const priority = [
    'hi',
    'hello',
    'smiled',
    'smile',
    'asked',
    'complimented',
    'greeted',
    'talked',
    'shared',
    'replied',
    'sent',
    'thanked',
    'person'
  ];
  return priority.find((word) => words.includes(word)) ?? words.find((word) => word.length >= 5) ?? null;
}

function cleanWord(value: string) {
  return value.replace(/[^a-z0-9']/gi, '').toLowerCase();
}

function getInitial(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized.charAt(0).toUpperCase() : 'I';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getResponsiveStyles(width: number, height: number, topInset: number, bottomInset: number) {
  const shortScreen = height <= 760;
  const tinyScreen = height <= 700;
  const pageWidth = Math.min(width, 430);
  const horizontalPadding = clamp(width * 0.044, 16, 22);
  const maxCardWidth = Math.min(pageWidth - horizontalPadding * 2, width * 0.9, 360 + posterCardPadding * 2);
  const heightReserve = tinyScreen ? 292 : shortScreen ? 316 : 342;
  const heightLimitedCardWidth =
    (height - topInset - bottomInset - heightReserve) / posterAspectRatio + posterCardPadding * 2;
  const minCardWidth = Math.min(maxCardWidth, tinyScreen ? 228 : 270);
  const cardWidth = clamp(Math.min(width * 0.9, maxCardWidth, heightLimitedCardWidth), minCardWidth, maxCardWidth);
  const posterWidth = cardWidth - posterCardPadding * 2;
  const titleSize = clamp(width * 0.078, 28, 36);
  const buttonHeight = tinyScreen ? 44 : 50;

  return {
    content: {
      flexGrow: 1,
      minHeight: Math.max(0, height - topInset - bottomInset),
      width: '100%' as const,
      maxWidth: pageWidth,
      alignSelf: 'center' as const,
      paddingHorizontal: horizontalPadding,
      paddingTop: tinyScreen ? 4 : shortScreen ? 6 : 10,
      paddingBottom: Math.max(bottomInset + 16, 24)
    },
    closeButton: {
      top: tinyScreen ? 6 : shortScreen ? 8 : 12,
      left: horizontalPadding,
      width: clamp(width * 0.096, 36, 42),
      height: clamp(width * 0.096, 36, 42),
      borderRadius: clamp(width * 0.048, 18, 21)
    },
    closeIconSize: clamp(width * 0.052, 20, 24),
    hero: {
      paddingTop: tinyScreen ? 8 : shortScreen ? 12 : 18,
      marginBottom: tinyScreen ? 10 : shortScreen ? 14 : 18
    },
    title: {
      fontSize: titleSize,
      lineHeight: titleSize + 4
    },
    subtitle: {
      fontSize: clamp(width * 0.034, 12, 15),
      lineHeight: clamp(width * 0.047, 17, 21),
      marginTop: tinyScreen ? 4 : 6
    },
    posterShadow: {
      width: cardWidth,
      aspectRatio: cardWidth / (posterWidth * posterAspectRatio + posterCardPadding * 2)
    },
    posterWidth,
    actions: {
      width: cardWidth,
      marginTop: tinyScreen ? 10 : 14
    },
    actionButton: {
      height: buttonHeight
    }
  };
}

const theme = {
  background: '#F7F7F5',
  text: '#090909',
  muted: '#2B2B2B',
  softMuted: '#8C8B88',
  border: 'rgba(17,17,17,0.11)',
  shadow: '#000000',
  white: '#FFFFFF'
};

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, "Times New Roman", serif',
  default: 'serif'
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.background
  },
  container: {
    flex: 1,
    backgroundColor: theme.background
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButton: {
    position: 'absolute',
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.64)',
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.12)',
    shadowColor: theme.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  },
  hero: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 52
  },
  title: {
    color: theme.text,
    fontFamily: serifFont,
    fontWeight: Platform.select({ web: '700', default: '700' }),
    textAlign: 'center',
    letterSpacing: 0
  },
  subtitle: {
    color: theme.muted,
    fontFamily: fonts.regular,
    textAlign: 'center',
    letterSpacing: 0
  },
  proudStrong: {
    color: theme.text,
    fontFamily: fonts.bold
  },
  posterShadow: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: posterCardPadding,
    shadowColor: theme.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6
  },
  posterCapture: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  actions: {
    alignItems: 'center',
    gap: 10
  },
  shareButton: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: theme.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  saveButton: {
    backgroundColor: '#111111',
    borderColor: '#111111'
  },
  platformButton: {
    backgroundColor: '#FFFFFF'
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    fontFamily: fonts.bold
  },
  platformText: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 19,
    fontFamily: fonts.bold
  },
  pressed: {
    opacity: 0.68,
    transform: [{ scale: 0.96 }]
  },
  primaryPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }]
  },
  secondaryPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.975 }]
  },
  disabled: {
    opacity: 0.58
  }
});

const posterStyles = StyleSheet.create({
  poster: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F5F5F3',
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.06)'
  },
  artboard: {
    position: 'absolute',
    width: posterBaseWidth,
    height: posterBaseHeight,
    backgroundColor: '#F5F5F3',
    overflow: 'hidden'
  },
  paperBase: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#F8F6F0'
  },
  paperWashA: {
    position: 'absolute',
    left: -44,
    top: 20,
    width: 154,
    height: 194,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.68)',
    transform: [{ rotate: '-12deg' }]
  },
  paperWashB: {
    position: 'absolute',
    right: -58,
    top: -30,
    width: 120,
    height: 132,
    borderRadius: 20,
    backgroundColor: 'rgba(17,17,17,0.075)',
    transform: [{ rotate: '17deg' }]
  },
  paperStripA: {
    position: 'absolute',
    left: 44,
    top: -40,
    width: 58,
    height: '120%',
    backgroundColor: 'rgba(255,255,255,0.36)',
    transform: [{ rotate: '-11deg' }]
  },
  paperStripB: {
    position: 'absolute',
    right: -24,
    bottom: -16,
    width: 86,
    height: 70,
    borderTopLeftRadius: 18,
    backgroundColor: lime,
    transform: [{ rotate: '-12deg' }]
  },
  paperNoiseA: {
    position: 'absolute',
    left: 16,
    right: 24,
    top: 126,
    height: 1,
    backgroundColor: 'rgba(17,17,17,0.035)',
    transform: [{ rotate: '-3deg' }]
  },
  paperNoiseB: {
    position: 'absolute',
    left: 26,
    right: 30,
    bottom: 84,
    height: 1,
    backgroundColor: 'rgba(17,17,17,0.04)',
    transform: [{ rotate: '4deg' }]
  },
  tornTopRight: {
    position: 'absolute',
    right: -18,
    top: -18,
    width: 86,
    height: 84,
    backgroundColor: '#DCDDDA',
    transform: [{ rotate: '22deg' }],
    borderBottomLeftRadius: 34
  },
  tornBottomLeft: {
    position: 'absolute',
    left: -28,
    bottom: -28,
    width: 96,
    height: 78,
    backgroundColor: '#E4E4DF',
    transform: [{ rotate: '-18deg' }],
    borderTopRightRadius: 42
  },
  limeCorner: {
    position: 'absolute',
    right: -36,
    bottom: -23,
    width: 108,
    height: 86,
    backgroundColor: lime,
    transform: [{ rotate: '-18deg' }],
    borderTopLeftRadius: 24
  },
  tape: {
    position: 'absolute',
    width: 94,
    height: 28,
    backgroundColor: 'rgba(218,218,212,0.86)',
    borderRadius: 3,
    zIndex: 8,
    overflow: 'hidden'
  },
  tapeTopLeft: {
    left: 8,
    top: 14,
    transform: [{ rotate: '-11deg' }]
  },
  tapeBottomRight: {
    right: 20,
    bottom: 52,
    transform: [{ rotate: '-21deg' }]
  },
  tapeFiberA: {
    position: 'absolute',
    left: 0,
    top: 7,
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)'
  },
  tapeFiberB: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    width: '76%',
    height: 1,
    backgroundColor: 'rgba(40,40,40,0.08)'
  },
  socialBadge: {
    position: 'absolute',
    top: 58,
    left: 18,
    zIndex: 10,
    minWidth: 94,
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-7deg' }],
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 }
  },
  socialBadgeText: {
    color: '#101010',
    fontSize: 13,
    lineHeight: 16,
    fontFamily: fonts.bold,
    textAlign: 'center'
  },
  wordmarkWrap: {
    position: 'absolute',
    top: 28,
    alignSelf: 'center',
    zIndex: 10,
    alignItems: 'center'
  },
  wordmark: {
    color: '#111111',
    fontSize: 23,
    lineHeight: 28,
    fontFamily: serifFont
  },
  wordmarkStroke: {
    width: 74,
    height: 4,
    borderRadius: 999,
    backgroundColor: lime,
    transform: [{ rotate: '-2deg' }]
  },
  crown: {
    position: 'absolute',
    right: 38,
    top: 68,
    zIndex: 10,
    transform: [{ rotate: '4deg' }]
  },
  heart: {
    position: 'absolute',
    left: 28,
    top: 258,
    zIndex: 10,
    transform: [{ rotate: '-9deg' }]
  },
  sparkleA: {
    position: 'absolute',
    left: 128,
    top: 93,
    zIndex: 10
  },
  sparkleB: {
    position: 'absolute',
    right: 48,
    top: 214,
    zIndex: 10
  },
  sparkleC: {
    position: 'absolute',
    right: 30,
    bottom: 118,
    zIndex: 10
  },
  leftBurst: {
    position: 'absolute',
    left: 19,
    top: 284,
    zIndex: 10
  },
  doodleLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 5
  },
  tapeSticker: {
    position: 'absolute',
    width: 62,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(201,255,53,0.42)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.05)'
  },
  tapeStickerTopLeft: {
    left: 18,
    top: 28,
    transform: [{ rotate: '-13deg' }]
  },
  tapeStickerBottomRight: {
    right: 24,
    bottom: 48,
    transform: [{ rotate: '-18deg' }]
  },
  crownDoodle: {
    position: 'absolute',
    right: 24,
    top: 125,
    opacity: 0.52,
    transform: [{ rotate: '8deg' }]
  },
  heartDoodle: {
    position: 'absolute',
    left: 8,
    top: 128,
    opacity: 0.48,
    transform: [{ rotate: '-10deg' }]
  },
  sparkleDoodleA: {
    position: 'absolute',
    right: 9,
    top: 238,
    opacity: 0.42,
    transform: [{ rotate: '10deg' }]
  },
  sparkleDoodleB: {
    position: 'absolute',
    left: 28,
    bottom: 92,
    opacity: 0.36,
    transform: [{ rotate: '-8deg' }]
  },
  lineDoodleLeft: {
    position: 'absolute',
    left: 10,
    bottom: 105,
    opacity: 0.22,
    transform: [{ rotate: '-6deg' }]
  },
  limeDot: {
    position: 'absolute',
    right: 58,
    bottom: 142,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: lime,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.14)',
    opacity: 0.8
  },
  softCircleTop: {
    position: 'absolute',
    right: 34,
    top: 40,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#111111',
    opacity: 0.1
  },
  softCircleBottom: {
    position: 'absolute',
    left: 38,
    bottom: 42,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#111111',
    opacity: 0.12
  },
  socialWinSticker: {
    position: 'absolute',
    left: 17,
    top: 54,
    zIndex: 6,
    width: 70,
    height: 40,
    borderRadius: 7,
    backgroundColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.09,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    transform: [{ rotate: '-10deg' }]
  },
  socialWinText: {
    color: '#111111',
    fontSize: 13,
    lineHeight: 13,
    fontFamily: fonts.bold,
    textAlign: 'center'
  },
  socialWinSpark: {
    position: 'absolute',
    right: 9,
    bottom: 5,
    color: '#111111',
    fontSize: 12,
    lineHeight: 12,
    fontFamily: fonts.bold
  },
  posterContent: {
    position: 'relative',
    height: '100%',
    paddingHorizontal: 24,
    paddingTop: 25,
    paddingBottom: 15,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    ...Platform.select({ web: ({ boxSizing: 'border-box' } as ViewStyle), default: {} })
  },
  headerRow: {
    width: '100%',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 8
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 6,
    borderColor: lime,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexShrink: 0,
    marginTop: 3,
    marginBottom: 10,
    backgroundColor: '#F8F6F0',
    shadowColor: '#000000',
    shadowOpacity: 0.13,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5
  },
  avatarFrame: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E8E8E5',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111'
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 31,
    lineHeight: 36,
    fontFamily: fonts.bold
  },
  journeyBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 210
  },
  journeyText: {
    color: '#111111',
    fontSize: 14,
    lineHeight: 17,
    fontFamily: serifFont,
    fontWeight: Platform.select({ web: '700', default: '700' }),
    letterSpacing: 0,
    textAlign: 'center'
  },
  microText: {
    color: '#6D6D68',
    fontSize: 7,
    lineHeight: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0,
    textAlign: 'center',
    marginTop: 3
  },
  posterTextFrame: {
    width: '85%',
    maxWidth: posterTitleContentWidth,
    minHeight: 108,
    maxHeight: posterTitleContentHeight,
    zIndex: 13,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    alignSelf: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    ...Platform.select({ web: ({ boxSizing: 'border-box' } as ViewStyle), default: {} })
  },
  achievementTitle: {
    color: '#080808',
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
    fontFamily: serifFont,
    fontWeight: Platform.select({ web: '800', default: '700' }),
    textAlign: 'center',
    letterSpacing: 0,
    flexShrink: 1,
    flexWrap: 'wrap',
    includeFontPadding: false,
    ...Platform.select({
      web: ({ whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' } as TextStyle),
      default: {}
    })
  },
  highlightWord: {
    backgroundColor: lime,
    color: '#080808'
  },
  posterTextWrapLong: {
    top: 136
  },
  posterLine: {
    color: '#0B0B0B',
    fontSize: 48,
    lineHeight: 48,
    fontFamily: serifFont,
    fontWeight: Platform.select({ web: '800', default: '700' }),
    textAlign: 'center',
    letterSpacing: 0
  },
  posterLineBalanced: {
    fontSize: 42,
    lineHeight: 42
  },
  posterLineCompact: {
    fontSize: 35,
    lineHeight: 36
  },
  hiWrap: {
    color: '#0B0B0B'
  },
  hiStroke: {
    backgroundColor: lime
  },
  randomWord: {
    textDecorationLine: 'underline',
    textDecorationColor: lime,
    textDecorationStyle: 'solid'
  },
  doneBrush: {
    position: 'absolute',
    left: 60,
    right: 60,
    top: 314,
    height: 46,
    zIndex: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  footerBlock: {
    width: '100%',
    zIndex: 14,
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    marginTop: 10
  },
  doneBadge: {
    minWidth: 176,
    maxWidth: '100%',
    height: 43,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    transform: [{ rotate: '-2deg' }]
  },
  donePaintStroke: {
    position: 'absolute',
    left: -4,
    top: 0
  },
  doneIcon: {
    width: 23,
    height: 23,
    borderRadius: 11.5,
    borderWidth: 1.5,
    borderColor: lime,
    backgroundColor: 'rgba(201,255,53,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fonts.bold,
    letterSpacing: 0,
    zIndex: 2
  },
  burstLines: {
    position: 'absolute',
    right: -10,
    top: 15
  },
  braveBadge: {
    position: 'absolute',
    left: 18,
    bottom: 20,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#111111',
    zIndex: 15,
    padding: 5,
    transform: [{ rotate: '-10deg' }]
  },
  braveInner: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 1.4,
    borderColor: lime,
    alignItems: 'center',
    justifyContent: 'center'
  },
  braveText: {
    color: '#111111',
    fontSize: 13,
    lineHeight: 14,
    fontFamily: fonts.bold,
    textAlign: 'center'
  },
  bottomCopy: {
    position: 'absolute',
    left: 94,
    right: 26,
    bottom: 11,
    zIndex: 16,
    alignItems: 'center'
  },
  bottomText: {
    color: '#2A2A2A',
    fontSize: 12,
    lineHeight: 15,
    fontFamily: fonts.regular,
    textAlign: 'center'
  },
  bottomBold: {
    color: '#111111',
    fontFamily: fonts.bold
  },
  oneDareUnderline: {
    width: 58,
    height: 3,
    borderRadius: 999,
    backgroundColor: lime,
    marginTop: -2,
    marginBottom: 7,
    transform: [{ rotate: '-2deg' }]
  },
  hashtag: {
    color: '#333333',
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fonts.regular,
    textAlign: 'center',
    letterSpacing: 0
  }
});
