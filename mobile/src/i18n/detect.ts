import { DEFAULT_LANG, isLang, type Lang } from './languages.ts';

/** First supported language from the device's preferred list, else English. */
export function pickLanguage(deviceCodes: (string | null | undefined)[]): Lang {
  for (const raw of deviceCodes) {
    if (!raw) continue;
    let code = raw.toLowerCase().split(/[-_]/)[0];
    if (code === 'iw') code = 'he'; // older Android versions report Hebrew as "iw"
    if (isLang(code)) return code;
  }
  return DEFAULT_LANG;
}
