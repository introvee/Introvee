export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function moderateScale(size: number, width: number, factor = 0.5) {
  const guidelineWidth = 390;
  const scaled = size * (width / guidelineWidth);
  return size + (scaled - size) * factor;
}

export function getResponsivePageMetrics(width: number, height: number) {
  const narrow = width <= 360;
  const short = height <= 700;
  const horizontalPadding = clamp(width * 0.052, narrow ? 16 : 18, 24);

  return {
    narrow,
    short,
    horizontalPadding,
    maxWidth: width >= 768 ? 560 : 430,
    cardPadding: clamp(width * 0.05, narrow ? 16 : 18, 24),
    cardRadius: narrow ? 18 : 22,
    headerTitleSize: clamp(moderateScale(18, width), 17, 22),
    bodySize: clamp(moderateScale(15, width, 0.35), 14, 16),
    smallSize: clamp(moderateScale(13, width, 0.35), 12, 14),
    buttonHeight: clamp(height * 0.062, 46, 54)
  };
}
