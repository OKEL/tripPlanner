import { getLocales } from 'expo-localization';

/** The device's preferred language codes, most preferred first. Empty if they can't be read. */
export function deviceCodes(): string[] {
  try {
    return getLocales().map((l) => l.languageCode ?? '');
  } catch {
    return [];
  }
}
