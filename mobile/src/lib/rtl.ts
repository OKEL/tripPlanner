import type { TextStyle } from 'react-native';

// First strong character decides the direction (Hebrew and Arabic ranges are RTL).
const RTL_CHAR = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
const LTR_CHAR = /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]/;

export function isRtl(text: string | null | undefined): boolean {
  if (!text) return false;
  for (const ch of text) {
    if (RTL_CHAR.test(ch)) return true;
    if (LTR_CHAR.test(ch)) return false;
  }
  return false;
}

/** Style for content text (trip data): each string gets its own direction in the English UI. */
export function contentTextStyle(text: string | null | undefined): TextStyle {
  return isRtl(text)
    ? { textAlign: 'right', writingDirection: 'rtl' }
    : { textAlign: 'left', writingDirection: 'ltr' };
}

/**
 * "from → to" for a transit. The arrow follows the text's reading direction: in an RTL line the first
 * place sits on the right, so the arrow has to point left (arrows are not mirrored automatically).
 */
export function routeText(from: string | null | undefined, to: string | null | undefined): string {
  const parts = [from, to].filter((p): p is string => !!p);
  if (parts.length < 2) return parts[0] ?? '';
  return parts.join(isRtl(parts[0]) ? ' ← ' : ' → ');
}
