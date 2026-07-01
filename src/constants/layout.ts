export const TAB_BAR_BASE_HEIGHT = 56;
export const TAB_BAR_FLOAT_OFFSET = 12;
export const TAB_BAR_EXTRA_SCROLL_SPACE = 28;
export const MIN_BOTTOM_SAFE_SPACE = 28;

export function getBottomSafeSpace(bottomInset: number) {
  return Math.max(bottomInset, MIN_BOTTOM_SAFE_SPACE);
}

export function getTabBarBottomOffset(bottomInset: number) {
  return getBottomSafeSpace(bottomInset) + TAB_BAR_FLOAT_OFFSET;
}

export function getTabBarReservedHeight(bottomInset: number) {
  return TAB_BAR_BASE_HEIGHT + getTabBarBottomOffset(bottomInset) + TAB_BAR_EXTRA_SCROLL_SPACE;
}
