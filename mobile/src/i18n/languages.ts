// The only list of supported UI languages. Keep AI_LANGUAGES in supabase/functions/_shared/languages.ts in sync.
import { en } from './en.ts';
import { he } from './he.ts';

export const LANGUAGES = {
  en: { nativeName: 'English', dir: 'ltr', locale: 'en-US', dict: en },
  he: { nativeName: 'עברית', dir: 'rtl', locale: 'he-IL', dict: he },
} as const;

export type Lang = keyof typeof LANGUAGES;
export const DEFAULT_LANG: Lang = 'en';
export const LANG_CODES = Object.keys(LANGUAGES) as Lang[];
export function isLang(x: unknown): x is Lang {
  return typeof x === 'string' && Object.hasOwn(LANGUAGES, x);
}
