import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Share, StyleSheet } from 'react-native';

import { Dialog } from '@/components/overlays';
import { AppText, Button } from '@/components/ui';
import { useT } from '@/i18n';
import { theme } from '@/theme';

const { colors, spacing, font } = theme;

const COPIED_MS = 2000;

type Props = { visible: boolean; title: string; code: string; onClose: () => void };

/** Shows the share code in large letters, copies it, or opens the system share sheet with a ready message. */
export function ShareModal({ visible, title, code, onClose }: Props) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const share = () =>
    void Share.share({ message: t.share.message(title, code) }).catch(() => {});
  const copy = async () => {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
    } catch {
      // Nothing to do: the code is on screen and selectable.
    }
  };

  return (
    <Dialog visible={visible} onClose={onClose} cardStyle={styles.card}>
      <AppText variant="heading">{t.share.title}</AppText>
      <AppText variant="muted" style={styles.centered}>
        {t.share.subtitle}
      </AppText>
      <AppText style={styles.code} selectable accessibilityLabel={t.share.shareCode(code.split('').join(' '))}>
        {code}
      </AppText>
      <Button title={t.share.share} icon="share-outline" onPress={share} style={styles.button} />
      <Button
        title={copied ? t.share.copied : t.share.copyCode}
        icon={copied ? 'checkmark' : 'copy-outline'}
        variant="secondary"
        onPress={() => void copy()}
        style={styles.button}
      />
      <Button title={t.common.done} variant="secondary" onPress={onClose} style={styles.button} />
    </Dialog>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.sm },
  centered: { textAlign: 'center' },
  code: {
    fontSize: font.size.codeLarge,
    fontFamily: font.bold,
    letterSpacing: 8,
    marginVertical: spacing.lg,
    color: colors.primary,
  },
  button: { alignSelf: 'stretch' },
});
