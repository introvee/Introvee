import html2canvas from 'html2canvas';
import { colors } from '../constants/colors';

export async function downloadScreenAsImage(element: HTMLElement | null, filename: string) {
  if (!element) {
    throw new Error('Screen element was not ready.');
  }

  const canvas = await html2canvas(element, {
    backgroundColor: colors.background,
    scale: 2,
    useCORS: true
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
