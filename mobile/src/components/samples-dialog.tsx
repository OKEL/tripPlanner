import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Dialog } from '@/components/overlays';
import { AppText, Button } from '@/components/ui';
import { useT } from '@/i18n';
import { SAMPLES, type Sample } from '@/lib/samples';
import { theme } from '@/theme';

const { colors, spacing } = theme;

type Props = { visible: boolean; onPick: (sample: Sample) => void; onClose: () => void };

/** List of the built-in sample itineraries (generated from docs/samples). */
export function SamplesDialog({ visible, onPick, onClose }: Props) {
  const t = useT();
  return (
    <Dialog visible={visible} onClose={onClose}>
      <AppText variant="heading">{t.samples.title}</AppText>
      <ScrollView style={styles.list}>
        {SAMPLES.map((sample) => (
          <Pressable
            key={sample.id}
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.background }]}
            onPress={() => onPick(sample)}>
            <AppText>{t.samples.titles[sample.id] ?? sample.title}</AppText>
          </Pressable>
        ))}
      </ScrollView>
      <Button title={t.common.cancel} variant="secondary" onPress={onClose} />
    </Dialog>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 320 },
  row: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
});
