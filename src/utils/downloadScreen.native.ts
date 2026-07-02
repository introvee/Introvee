import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

type MediaLibraryModule = typeof import('expo-media-library/legacy');

export async function captureScreenAsImage(element: unknown, filename: string) {
  if (!element) {
    throw new Error('Screen was not ready to share.');
  }

  return captureRef(element as never, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    fileName: filename.replace(/\.png$/i, '')
  });
}

async function getMediaLibraryModule() {
  try {
    return (await import('expo-media-library/legacy')) as MediaLibraryModule;
  } catch {
    return null;
  }
}

async function shareCapturedImage(uri: string, dialogTitle: string) {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle,
    UTI: 'public.png'
  });
}

export async function saveScreenAsImage(element: unknown, filename: string) {
  const uri = await captureScreenAsImage(element, filename);
  const MediaLibrary = await getMediaLibraryModule();

  if (!MediaLibrary) {
    await shareCapturedImage(uri, 'Save Post');
    return uri;
  }

  const permission = await MediaLibrary.requestPermissionsAsync(true);

  if (!permission.granted) {
    throw new Error('Photo library permission was not granted.');
  }

  await MediaLibrary.saveToLibraryAsync(uri);
  return uri;
}

export async function shareScreenImage(element: unknown, filename: string, dialogTitle = 'Share My Win') {
  const uri = await captureScreenAsImage(element, filename);

  await shareCapturedImage(uri, dialogTitle);
  return uri;
}

export async function downloadScreenAsImage(element: unknown, filename: string) {
  return shareScreenImage(element, filename);
}
