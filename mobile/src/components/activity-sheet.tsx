import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { errorMessage, getPlaceInfo } from '@/api';
import { ContentText } from '@/components/content-text';
import { BottomSheet } from '@/components/overlays';
import { AppText, Button } from '@/components/ui';
import { useLang, useT } from '@/i18n';
import { openInMaps } from '@/lib/maps';
import { theme } from '@/theme';
import type { Activity } from '@/types/plan';

const { colors, spacing, radius, font } = theme;

type Props = { visible: boolean; activity: Activity | null; number: string; onClose: () => void };

/** Bottom sheet with the activity details. */
export function ActivitySheet({ visible, activity, number, onClose }: Props) {
  const t = useT();
  return (
    <BottomSheet visible={visible} onClose={onClose} handle style={styles.sheet}>
      {activity ? (
        <ScrollView bounces={false} contentContainerStyle={styles.body}>
          <AppText variant="muted">{number}</AppText>
          <ContentText style={styles.name}>{activity.name}</ContentText>
          {activity.time ? <AppText variant="label">{activity.time}</AppText> : null}
          {activity.notes ? <ContentText style={styles.notes}>{activity.notes}</ContentText> : null}
          {activity.place_query ? (
            <Button
              title={t.activity.openInMaps}
              variant="secondary"
              icon="navigate-outline"
              onPress={() => void openInMaps(activity.place_query!)}
              style={styles.button}
            />
          ) : null}
          {activity.place_query ? <MoreInfo key={activity.place_query} placeQuery={activity.place_query} /> : null}
          <Button title={t.common.close} variant="secondary" onPress={onClose} />
        </ScrollView>
      ) : null}
    </BottomSheet>
  );
}

// Summaries already fetched in this session (the server also caches them per place).
const summaryCache = new Map<string, string>();
const cacheKey = (placeQuery: string, lang: string) => `${lang}|${placeQuery}`;

/** On-demand AI summary of the place. Keyed by the place so its state resets when the place changes. */
function MoreInfo({ placeQuery }: { placeQuery: string }) {
  const t = useT();
  const lang = useLang();
  const key = cacheKey(placeQuery, lang);
  const [fetched, setFetched] = useState<{ key: string; text: string } | null>(null);
  // Keyed by (place, language): switching the language never shows a summary in the old one.
  const summary = fetched?.key === key ? fetched.text : (summaryCache.get(key) ?? null);
  // Closing the summary only hides it. It stays loaded, so reopening needs no new call.
  const [shown, setShown] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await getPlaceInfo(placeQuery, lang);
      summaryCache.set(key, result.summary);
      setFetched({ key, text: result.summary });
    } catch (err) {
      setError(errorMessage(err, 'place'));
    } finally {
      setLoading(false);
    }
  };

  if (summary && shown) {
    return (
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <AppText variant="label">{t.activity.aboutPlace}</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel={t.common.hide} onPress={() => setShown(false)} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>
        <AppText>{summary}</AppText>
        <AppText variant="muted">{t.activity.aiLabel}</AppText>
      </View>
    );
  }
  if (summary) {
    return (
      <View style={styles.info}>
        <Button title={t.activity.moreInfo} variant="secondary" icon="sparkles-outline" onPress={() => setShown(true)} />
      </View>
    );
  }
  return (
    <View style={styles.info}>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? (
        <AppText variant="small" style={styles.error}>
          {error}
        </AppText>
      ) : null}
      <Button
        title={error ? t.common.retry : t.activity.moreInfo}
        variant="secondary"
        icon={error ? 'refresh' : 'sparkles-outline'}
        onPress={() => void load()}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  info: { gap: spacing.sm, marginTop: spacing.xs },
  infoCard: { gap: spacing.sm, marginTop: spacing.xs, backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md },
  infoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  error: { color: colors.danger },
  sheet: { maxHeight: '75%', paddingHorizontal: spacing.lg },
  body: { gap: spacing.sm },
  name: { fontSize: font.size.lg, fontFamily: font.bold },
  notes: { color: colors.text },
  button: { marginTop: spacing.sm },
});
