export type SocialShareTarget = 'instagram' | 'whatsapp';

export async function isShareTargetInstalled(_target: SocialShareTarget) {
  return true;
}

export async function shareImageToSocial(target: SocialShareTarget, uri: string, message: string) {
  if (!navigator.share) {
    throw new Error('This browser does not support sharing image files. Please test WhatsApp/Instagram sharing in the iOS or Android app.');
  }

  const file = dataUriToFile(uri, target === 'whatsapp' ? 'introvert-dare-whatsapp.png' : 'introvert-dare-instagram.png');
  const shareData = {
    title: 'Introvee Dare Complete',
    text: target === 'whatsapp' ? message : undefined,
    files: [file]
  };

  if (navigator.canShare && !navigator.canShare({ files: shareData.files })) {
    throw new Error('This browser cannot share PNG image files. Please test WhatsApp/Instagram sharing in the iOS or Android app.');
  }

  await navigator.share(shareData);
}

function dataUriToFile(dataUri: string, filename: string) {
  const [metadata, base64Data] = dataUri.split(',');
  const mimeMatch = metadata.match(/^data:(.*?);base64$/);

  if (!base64Data || !mimeMatch) {
    throw new Error('Captured image was not a shareable PNG data URI.');
  }

  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let index = 0; index < byteCharacters.length; index += 1) {
    byteNumbers[index] = byteCharacters.charCodeAt(index);
  }

  return new File([new Uint8Array(byteNumbers)], filename, { type: mimeMatch[1] });
}
