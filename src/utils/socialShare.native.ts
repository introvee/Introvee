import { Linking, Platform, Share } from 'react-native';

export type SocialShareTarget = 'instagram' | 'whatsapp';

let cachedRNShare: any | null | undefined;

function getRNShare() {
  if (cachedRNShare !== undefined) {
    return cachedRNShare;
  }

  try {
    cachedRNShare = require('react-native-share');
  } catch (error) {
    cachedRNShare = null;
  }

  return cachedRNShare;
}

export async function isShareTargetInstalled(target: SocialShareTarget) {
  const rnShare = getRNShare();

  if (!rnShare) {
    const urlScheme = target === 'whatsapp' ? 'whatsapp://send' : 'instagram://app';
    return Linking.canOpenURL(urlScheme);
  }

  if (Platform.OS === 'android') {
    const packageName = target === 'whatsapp' ? 'com.whatsapp' : 'com.instagram.android';
    const shareModule = rnShare.default ?? rnShare;
    const result = await shareModule.isPackageInstalled(packageName);
    return result.isInstalled;
  }

  const urlScheme = target === 'whatsapp' ? 'whatsapp://send' : 'instagram://app';
  return Linking.canOpenURL(urlScheme);
}

export async function shareImageToSocial(target: SocialShareTarget, uri: string, message: string) {
  const rnShare = getRNShare();

  if (!rnShare) {
    await Share.share({ message, url: uri });
    return;
  }

  const RNShare = rnShare.default ?? rnShare;
  const Social = rnShare.Social;

  if (target === 'whatsapp') {
    const whatsappOptions = {
      title: 'Share to WhatsApp',
      social: Social.Whatsapp,
      url: uri,
      type: 'image/png',
      filename: 'introvert-dare-whatsapp',
      message,
      failOnCancel: false
    };
    await RNShare.shareSingle(whatsappOptions);
    return;
  }

  try {
    await RNShare.shareSingle({
      title: 'Share to Instagram',
      social: Social.Instagram,
      url: uri,
      type: 'image/png',
      filename: 'introvert-dare-instagram',
      message
    });
  } catch (error) {
    await RNShare.shareSingle({
      title: 'Share to Instagram',
      social: Social.Instagram,
      url: uri,
      type: 'image/png',
      filename: 'introvert-dare-instagram'
    });
  }
}
