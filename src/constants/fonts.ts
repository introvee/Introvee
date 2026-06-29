import { Platform } from 'react-native';

export const fonts = {
  regular: Platform.select({ ios: 'System', android: 'sans-serif', web: '"Inter", "SF Pro Display", "Manrope", system-ui, sans-serif', default: 'Arial' }),
  medium: Platform.select({ ios: 'System', android: 'sans-serif-medium', web: '"Inter", "SF Pro Display", "Manrope", system-ui, sans-serif', default: 'Arial' }),
  bold: Platform.select({ ios: 'System', android: 'sans-serif-medium', web: '"Inter", "SF Pro Display", "Manrope", system-ui, sans-serif', default: 'Arial' }),
  display: Platform.select({ ios: 'System', android: 'sans-serif-medium', web: '"Manrope", "SF Pro Display", "Inter", system-ui, sans-serif', default: 'Arial' })
};
