import { useStore } from '@/store';

import type { Dict } from './en.ts';
import { LANG_CODES, LANGUAGES, type Lang } from './languages.ts';

export { deviceCodes } from './device';
export { pickLanguage } from './detect.ts';
export type { Dict } from './en.ts';
export { DEFAULT_LANG, isLang, LANG_CODES, LANGUAGES, type Lang } from './languages.ts';

export function useLang(): Lang {
  return useStore((s) => s.lang);
}

/** Dictionary for the current language. Subscribes to the store, so screens re-render on a change. */
export function useT(): Dict {
  return LANGUAGES[useLang()].dict;
}

/** For non-React code (api.ts errors, share message). Reads the current store value. */
export function getT(): Dict {
  return LANGUAGES[useStore.getState().lang].dict;
}

export function getLocale(): string {
  return LANGUAGES[useStore.getState().lang].locale;
}

/** The word that introduces the code in every language's share message (to parse a pasted message in any language). */
export function allCodeLabels(): string[] {
  return LANG_CODES.map((code) => LANGUAGES[code].dict.share.codeLabel);
}
