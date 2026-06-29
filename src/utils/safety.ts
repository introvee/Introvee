export function isSafeDareText(text: string) {
  const blocked = ['alone at night', 'share your phone', 'private photo', 'isolated', 'stranger at night'];
  const value = text.toLowerCase();
  return !blocked.some((term) => value.includes(term));
}
