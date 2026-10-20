import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { errorMessage } from '@/api';
import { Dialog } from '@/components/overlays';
import { AppText, Button, textInputStyle } from '@/components/ui';
import { useT } from '@/i18n';
import { contentTextStyle } from '@/lib/rtl';
import { useRotatingMessage } from '@/lib/use-rotating-message';
import { theme } from '@/theme';

const { colors, spacing } = theme;

type Props = {
  visible: boolean;
  /** Applies the instruction. Resolves when done; throws on failure. */
  onSubmit: (instruction: string) => Promise<void>;
  onClose: () => void;
};

/** "Tell me what to change" input for the trip owner. The text is kept if the call fails. */
export function RefineModal({ visible, onSubmit, onClose }: Props) {
  const t = useT();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = useRotatingMessage(t.refine.loading, busy);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await onSubmit(text.trim());
      setText('');
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'refine'));
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    if (!busy) onClose();
  };

  return (
    <Dialog visible={visible} onClose={close}>
      <AppText variant="heading">{t.refine.title}</AppText>
      <AppText variant="muted">{t.refine.hint}</AppText>
      <TextInput
        style={[textInputStyle, styles.input, contentTextStyle(text)]}
        value={text}
        onChangeText={setText}
        editable={!busy}
        multiline
        maxLength={1000}
        textAlignVertical="top"
        placeholder={t.refine.placeholder}
        placeholderTextColor={colors.textMuted}
        autoFocus
      />
      {error ? (
        <AppText variant="small" style={styles.error}>
          {error}
        </AppText>
      ) : null}
      <Button
        title={busy ? status : error ? t.common.retry : t.refine.apply}
        icon="sparkles-outline"
        onPress={() => void submit()}
        disabled={text.trim().length === 0}
        loading={busy}
      />
      <Button title={t.common.cancel} variant="secondary" onPress={close} disabled={busy} />
    </Dialog>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 96, paddingVertical: spacing.md },
  error: { color: colors.danger },
});
