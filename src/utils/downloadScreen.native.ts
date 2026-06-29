import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export async function downloadScreenAsImage(element: unknown, filename: string) {
  if (!element) {
    throw new Error('Screen was not ready to share.');
  }

  const uri = await captureRef(element as never, {
    format: 'png',
    quality: 1,
    fileName: filename.replace(/\.png$/i, '')
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: 'Share My Win',
    UTI: 'public.png'
  });
}
