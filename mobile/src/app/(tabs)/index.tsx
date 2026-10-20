import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { ActionMenu, removeTripMenu, type MenuConfig } from '@/components/action-menu';
import { ContentText } from '@/components/content-text';
import { LanguagePrompt } from '@/components/language-prompt';
import { SyncBanner } from '@/components/sync-banner';
import { AppText, Button, EmptyState, IconButton, LinkButton, Pill, ScreenHeader } from '@/components/ui';
import { LANGUAGES, useLang, useT } from '@/i18n';
import { useHydrated } from '@/lib/hydration';
import { tripSummary, updatedLabel } from '@/lib/dates';
import { refreshAll } from '@/lib/sync';
import { sortedTrips, useStore, type StoredTrip } from '@/store';
import { theme } from '@/theme';

const { colors, spacing, radius, size, font, opacity } = theme;

/** Stable color per trip, picked from the palette by the trip id. */
function tripColor(id: string): string {
  let sum = 0;
  for (const ch of id) sum += ch.charCodeAt(0);
  return theme.tripColors[sum % theme.tripColors.length];
}

/** First letter or digit of the title, shown in the trip's colored square. */
function initial(title: string): string {
  const match = title.match(/[\p{L}\p{N}]/u);
  return match ? match[0].toUpperCase() : '✈';
}

export default function MyTrips() {
  const trips = useStore((s) => s.trips);
  const removeTrip = useStore((s) => s.removeTrip);
  const setLastOpened = useStore((s) => s.setLastOpened);
  const t = useT();
  const locale = LANGUAGES[useLang()].locale;
  const hydrated = useHydrated();
  const langChosen = useStore((s) => s.langChosen);
  const [refreshing, setRefreshing] = useState(false);
  const [menu, setMenu] = useState<MenuConfig | null>(null);
  const list = sortedTrips(trips);

  const openTrip = (id: string) => {
    setLastOpened(id);
    router.navigate('/plan');
  };

  const addMenu = () =>
    setMenu({
      title: t.myTrips.addMenuTitle,
      actions: [
        { label: t.myTrips.createNew, onPress: () => router.push('/create') },
        { label: t.myTrips.joinWithCode, onPress: () => router.push('/join') },
      ],
    });

  // Removes the trip from this device only. The trip itself stays on the server.
  const confirmRemove = (item: StoredTrip) => setMenu(removeTripMenu(t, item, () => removeTrip(item.trip.id)));

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.tabs.myTrips} right={<LinkButton title={t.myTrips.add} onPress={addMenu} />} />
      <SyncBanner />
      <FlatList
        data={list}
        keyExtractor={(item) => item.trip.id}
        contentContainerStyle={list.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="map-outline"
            title={t.myTrips.emptyTitle}
            text={t.myTrips.emptyText}>
            <Button title={t.myTrips.createNew} icon="add" onPress={() => router.push('/create')} />
            <Button title={t.myTrips.joinWithCode} variant="secondary" onPress={() => router.push('/join')} />
          </EmptyState>
        }
        renderItem={({ item }) => {
          const summary = tripSummary(item.trip.plan.events.filter((e) => e.type === 'day'), locale, t.common.days);
          const byline = [
            item.trip.creator_name ? t.myTrips.by(item.trip.creator_name) : null,
            t.myTrips.updated(updatedLabel(item.trip.updated_at, locale)),
          ]
            .filter(Boolean)
            .join(' · ');
          // The "⋯" button sits next to the card's pressable area, not inside it (no nested buttons).
          return (
            <View style={styles.card}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={[item.trip.title, item.role === 'owner' ? t.common.owner : null, summary, byline]
                  .filter(Boolean)
                  .join(', ')}
                accessibilityHint={t.myTrips.opensPlan}
                onPress={() => openTrip(item.trip.id)}
                onLongPress={() => confirmRemove(item)}
                style={({ pressed }) => [styles.cardMain, pressed && { opacity: opacity.pressed }]}>
                <View style={[styles.avatar, { backgroundColor: tripColor(item.trip.id) }]}>
                  <AppText style={styles.avatarText}>{initial(item.trip.title)}</AppText>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <ContentText style={styles.cardTitle} numberOfLines={2}>
                      {item.trip.title}
                    </ContentText>
                    {item.role === 'owner' ? <Pill text={t.common.owner} /> : null}
                  </View>
                  <AppText variant="muted">{summary}</AppText>
                  <AppText variant="muted">{byline}</AppText>
                  {item.unavailable ? (
                    <AppText variant="small" style={styles.unavailable}>
                      {t.myTrips.unavailable}
                    </AppText>
                  ) : null}
                </View>
              </Pressable>
              <IconButton icon="ellipsis-vertical" label={t.myTrips.options(item.trip.title)} onPress={() => confirmRemove(item)} />
            </View>
          );
        }}
      />
      <ActionMenu menu={menu} onClose={() => setMenu(null)} />
      <LanguagePrompt visible={hydrated && !langChosen} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.md },
  emptyContainer: { flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    paddingRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...theme.shadow.card,
  },
  cardMain: { flex: 1, flexDirection: 'row', gap: spacing.md },
  avatar: { width: size.avatar, height: size.avatar, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.onPrimary, fontSize: font.size.lg, fontFamily: font.bold },
  cardBody: { flex: 1, gap: spacing.xxs },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { flex: 1, fontSize: font.size.cardTitle, fontFamily: font.bold },
  unavailable: { color: colors.danger, marginTop: spacing.xs },
});
