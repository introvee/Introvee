import html2canvas from 'html2canvas';
import { colors } from '../constants/colors';

export async function captureScreenAsImage(element: HTMLElement | null, filename: string) {
  if (!element) {
    throw new Error('Screen element was not ready.');
  }

  const canvas = await html2canvas(element, {
    backgroundColor: colors.background,
    scale: 2,
    useCORS: true
  });

  return canvas.toDataURL('image/png');
}

export async function saveScreenAsImage(element: HTMLElement | null, filename: string) {
  const imageUrl = await captureScreenAsImage(element, filename);
  const link = document.createElement('a');
  link.download = filename;
  link.href = imageUrl;
  link.click();
  return imageUrl;
}

export async function shareScreenImage(element: HTMLElement | null, filename: string) {
  const imageUrl = await captureScreenAsImage(element, filename);
  const link = document.createElement('a');
  link.download = filename;
  link.href = imageUrl;
  link.click();
  return imageUrl;
}

export async function downloadScreenAsImage(element: HTMLElement | null, filename: string) {
  return saveScreenAsImage(element, filename);
}
