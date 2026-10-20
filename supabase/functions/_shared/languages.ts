// Languages the AI can write in. Keep in sync with mobile/src/i18n/languages.ts (docs/I18N.md 6).
export const AI_LANGUAGES = { en: "English", he: "Hebrew" } as const;
export type Lang = keyof typeof AI_LANGUAGES;

/** Unknown or missing → "en". Never put client text into a prompt; only the names above. */
export function resolveLang(x: unknown): Lang {
  return typeof x === "string" && Object.hasOwn(AI_LANGUAGES, x) ? (x as Lang) : "en";
}
