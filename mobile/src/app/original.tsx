import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ContentText } from '@/components/content-text';
import { AppText } from '@/components/ui';
import { useT } from '@/i18n';
import { useStore } from '@/store';
import { theme } from '@/theme';

const { colors, spacing, radius } = theme;

/** The text the plan was extracted from, so the user can check nothing was invented. */
export default function OriginalText() {
  const t = useT();
  const stored = useStore((s) => (s.lastOpenedTripId ? s.trips[s.lastOpenedTripId] : undefined));
  if (!stored) return <Redirect href="/" />;

  // One text per line, so Hebrew and English lines each get their own direction.
  const lines = stored.trip.source_text.split('\n');
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AppText variant="muted">{t.original.intro}</AppText>
      <View style={styles.card}>
        {lines.map((line, i) =>
          line.trim() === '' ? (
            <View key={i} style={styles.blank} />
          ) : (
            <ContentText key={i} selectable>
              {line}
            </ContentText>
          ),
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.xxs },
  blank: { height: spacing.md },
});
