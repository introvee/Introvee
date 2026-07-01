export type SocialShareTarget = 'instagram' | 'whatsapp';

export async function isShareTargetInstalled(_target: SocialShareTarget) {
  return true;
}

export async function shareImageToSocial(_target: SocialShareTarget, _uri: string, _message: string) {
  return;
}
