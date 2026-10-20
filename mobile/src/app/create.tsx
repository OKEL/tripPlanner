import { File } from 'expo-file-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';

import { createTrip, errorMessage } from '@/api';
import { NamePrompt } from '@/components/name-prompt';
import { SamplesDialog } from '@/components/samples-dialog';
import { AppText, Button, LinkButton, textInputStyle } from '@/components/ui';
import { useT } from '@/i18n';
import { todayISO } from '@/lib/dates';
import { contentTextStyle } from '@/lib/rtl';
import { saveOwnerToken } from '@/lib/tokens';
import { useRotatingMessage } from '@/lib/use-rotating-message';
import { useStore } from '@/store';
import { theme } from '@/theme';

const { colors, spacing, radius } = theme;

const MAX_CHARS = 20_000;
const COUNTER_FROM = 18_000;
const MAX_PDF_BYTES = 5 * 1024 * 1024;

export default function CreateTrip() {
  const t = useT();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askName, setAskName] = useState(false);
  const [samplesOpen, setSamplesOpen] = useState(false);
  const [pdf, setPdf] = useState<{ name: string; base64: string } | null>(null);

  const displayName = useStore((s) => s.displayName);
  const namePrompted = useStore((s) => s.namePrompted);

  // Rotating status text while the extraction runs (10-30 seconds).
  const status = useRotatingMessage(t.create.loading, busy);

  const tooLong = text.length > MAX_CHARS;
  const canCreate = (pdf !== null || (text.trim().length > 0 && !tooLong)) && !busy;

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const creatorName = useStore.getState().displayName || undefined;
      // The device's date, so dates without a year resolve in the user's time zone.
      const today = todayISO();
      const { trip, owner_token } = await createTrip(
        pdf ? { pdfBase64: pdf.base64, creatorName, today } : { text: text.trim(), creatorName, today },
      );
      await saveOwnerToken(trip.id, owner_token);
      const { upsertTrip, setLastOpened } = useStore.getState();
      upsertTrip(trip, 'owner');
      setLastOpened(trip.id);
      router.replace('/plan');
    } catch (err) {
      // The pasted text stays in the box so nothing is lost.
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  // .txt goes into the text box (the user can edit it); .pdf is sent as is and read on the server.
  const attachFile = async () => {
    setError(null);
    try {
      // File.pickFileAsync returns a File the app is allowed to read (a plain URI from the
      // document picker is not readable on Android: "Missing 'read' permission").
      const picked = await File.pickFileAsync({ mimeTypes: ['text/plain', 'application/pdf'] });
      if (picked.canceled) return;
      const file = picked.result;
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        if (file.size > MAX_PDF_BYTES) {
          setError(t.create.pdfTooLarge);
          return;
        }
        setPdf({ name: file.name, base64: await file.base64() });
        setText('');
      } else {
        setText(await file.text());
        setPdf(null);
      }
    } catch (err) {
      console.warn('attachFile failed:', err);
      const detail = __DEV__ && err instanceof Error ? ` (${err.message})` : '';
      setError(`${t.create.readFailed}${detail}`);
    }
  };

  const onCreatePress = () => {
    if (!namePrompted) setAskName(true);
    else void submit();
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.toolbar}>
        <AppText variant="label">{t.create.pasteHere}</AppText>
        <View style={styles.toolbarActions}>
          <LinkButton title={t.create.attachFile} onPress={() => void attachFile()} disabled={busy} />
          <LinkButton title={t.create.loadSample} onPress={() => setSamplesOpen(true)} disabled={busy} />
        </View>
      </View>
      {pdf ? (
        <View style={styles.pdfChip}>
          <AppText variant="small" numberOfLines={1} style={styles.pdfName}>
            {t.create.pdfAttached(pdf.name)}
          </AppText>
          <LinkButton title={t.common.remove} onPress={() => setPdf(null)} disabled={busy} />
        </View>
      ) : null}
      <TextInput
        style={[textInputStyle, styles.input, contentTextStyle(text)]}
        multiline
        value={text}
        onChangeText={setText}
        editable={!busy && pdf === null}
        placeholder={pdf ? t.create.pdfPlaceholder : t.create.placeholder}
        placeholderTextColor={colors.textMuted}
        textAlignVertical="top"
        autoCorrect={false}
      />
      {text.length >= COUNTER_FROM ? (
        <AppText variant="muted" style={[styles.counter, tooLong && { color: colors.danger }]}>
          {text.length.toLocaleString('en')} / {MAX_CHARS.toLocaleString('en')}
        </AppText>
      ) : null}
      {error ? (
        <View style={styles.errorBox}>
          <AppText variant="small" style={styles.errorText}>
            {error}
          </AppText>
        </View>
      ) : null}
      <Button
        title={busy ? status : error ? t.common.retry : t.create.createPlan}
        icon={error ? 'refresh' : 'sparkles-outline'}
        onPress={onCreatePress}
        disabled={!canCreate}
        loading={busy}
        style={styles.createButton}
      />

      <NamePrompt
        visible={askName}
        initial={displayName}
        onDone={(name) => {
          setAskName(false);
          const { setDisplayName, markNamePrompted } = useStore.getState();
          if (name) setDisplayName(name);
          else markNamePrompted();
          void submit();
        }}
      />

      <SamplesDialog
        visible={samplesOpen}
        onClose={() => setSamplesOpen(false)}
        onPick={(sample) => {
          setText(sample.text);
          setPdf(null);
          setError(null);
          setSamplesOpen(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.background },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toolbarActions: { flexDirection: 'row', gap: spacing.lg },
  pdfChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pdfName: { flex: 1 },
  input: { flex: 1, paddingVertical: spacing.md },
  counter: { textAlign: 'right' },
  errorBox: { backgroundColor: colors.dangerSoft, borderRadius: radius.sm, padding: spacing.md },
  errorText: { color: colors.danger },
  createButton: { marginTop: spacing.xs },
});
