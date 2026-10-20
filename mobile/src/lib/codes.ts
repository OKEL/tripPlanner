// Mirrors supabase/functions/_shared/codes.ts (alphabet without 0/O, 1/I/L).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;

/** Uppercases and drops anything outside the alphabet (spaces, dashes). */
export function normalizeShareCode(input: string): string {
  return input
    .toUpperCase()
    .split('')
    .filter((c) => CODE_ALPHABET.includes(c))
    .join('');
}

/**
 * Turns pasted text into a code. Accepts the whole share message
 * ("Join my trip '…' on TripPlan. Code: K7QX3M") as well as a bare code.
 * `labels` are the words that introduce the code in every language's share message ("Code", "קוד", …).
 */
export function extractShareCode(input: string, labels: readonly string[] = ['code']): string {
  const escaped = labels.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const afterLabel = input.match(new RegExp(`(?:${escaped})[\\s:=\\-–]*([a-z0-9]{6})(?![a-z0-9])`, 'i'));
  if (afterLabel) return normalizeShareCode(afterLabel[1]);
  // Otherwise a standalone 6-character code anywhere in the text.
  const standalone = input.toUpperCase().match(/(?:^|[^A-Z0-9])([A-HJKMNP-Z2-9]{6})(?![A-Z0-9])/);
  return standalone ? standalone[1] : normalizeShareCode(input);
}
