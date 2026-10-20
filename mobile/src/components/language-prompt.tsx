import { LanguageOptions } from '@/components/language-options';
import { Dialog } from '@/components/overlays';
import { AppText, Button } from '@/components/ui';
import { useLang, useT } from '@/i18n';
import { useStore } from '@/store';

/** Asks for the UI language once. The detected language is pre-selected; picking a row previews it. */
export function LanguagePrompt({ visible }: { visible: boolean }) {
  const t = useT();
  const lang = useLang();
  const previewLang = useStore((s) => s.previewLang);
  const markLangChosen = useStore((s) => s.markLangChosen);
  // No tap-outside close. Android back keeps the selected language.
  return (
    <Dialog visible={visible} onClose={markLangChosen} closeOnBackdrop={false}>
      <AppText variant="heading">{t.language.title}</AppText>
      <AppText variant="muted">{t.language.hint}</AppText>
      <LanguageOptions value={lang} onSelect={previewLang} />
      <Button title={t.language.continue} onPress={markLangChosen} />
    </Dialog>
  );
}
