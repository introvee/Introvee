import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

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

export async function saveScreenAsImage(element: unknown, filename: string) {
  const uri = await captureScreenAsImage(element, filename);
  const permission = await MediaLibrary.requestPermissionsAsync(true);

  if (!permission.granted) {
    throw new Error('Photo library permission was not granted.');
  }

  await MediaLibrary.saveToLibraryAsync(uri);
  return uri;
}

export async function shareScreenImage(element: unknown, filename: string, dialogTitle = 'Share My Win') {
  const uri = await captureScreenAsImage(element, filename);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle,
    UTI: 'public.png'
  });

  return uri;
}

export async function downloadScreenAsImage(element: unknown, filename: string) {
  return shareScreenImage(element, filename);
}
