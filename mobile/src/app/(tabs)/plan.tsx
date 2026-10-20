import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError, errorMessage, refineTrip } from '@/api';
import { ActionMenu, removeTripMenu, type MenuConfig } from '@/components/action-menu';
import { PlanView } from '@/components/plan-view';
import { RefineModal } from '@/components/refine-modal';
import { ShareModal } from '@/components/share-modal';
import { SyncBanner } from '@/components/sync-banner';
import { ActionChip, AppText, Banner, Button, EmptyState, ScreenHeader } from '@/components/ui';
import { LANGUAGES, useLang, useT } from '@/i18n';
import { tripSummary } from '@/lib/dates';
import { refreshAll } from '@/lib/sync';
import { getOwnerToken } from '@/lib/tokens';
import { useStore } from '@/store';
import { theme } from '@/theme';

const { colors, spacing } = theme;

export default function TripPlan() {
  const t = useT();
  const lang = useLang();
  const lastOpenedTripId = useStore((s) => s.lastOpenedTripId);
  const stored = useStore((s) => (s.lastOpenedTripId ? s.trips[s.lastOpenedTripId] : undefined));
  const [refreshing, setRefreshing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [menu, setMenu] = useState<MenuConfig | null>(null);
  const [switching, setSwitching] = useState<'undo' | 'redo' | null>(null);
  // Explanation from the last refinement, with the trip it belongs to.
  const [note, setNote] = useState<{ tripId: string; text: string } | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  // No trip opened yet (or it was removed from this device).
  if (!lastOpenedTripId || !stored) return <NoTripOpen />;
  const { trip, unavailable, role } = stored;
  const isOwner = role === 'owner';
  const visibleNote = note && note.tripId === trip.id ? note.text : null;

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const ownerToken = async () => {
    const token = await getOwnerToken(trip.id);
    if (!token) throw new ApiError('no_token', t.errors.no_token);
    return token;
  };

  const refine = async (instruction: string) => {
    const result = await refineTrip({ tripId: trip.id, ownerToken: await ownerToken(), instruction, lang });
    useStore.getState().upsertTrip(result.trip, 'owner');
    setSwitchError(null);
    const text = result.note ?? (result.changed === false ? t.refine.noChanges : null);
    setNote(text ? { tripId: trip.id, text } : null);
  };

  // Undo and Redo switch between the last two versions. No AI call is made.
  const switchVersion = async (mode: 'undo' | 'redo') => {
    setSwitchError(null);
    setSwitching(mode);
    try {
      const result = await refineTrip({
        tripId: trip.id,
        ownerToken: await ownerToken(),
        undo: mode === 'undo',
        redo: mode === 'redo',
      });
      useStore.getState().upsertTrip(result.trip, 'owner');
      setNote(null);
    } catch (err) {
      setSwitchError(errorMessage(err));
    } finally {
      setSwitching(null);
    }
  };

  const moreMenu = () =>
    setMenu({
      title: trip.title,
      actions: [
        ...(isOwner ? [{ label: t.plan.refineWithAi, onPress: () => setRefineOpen(true) }] : []),
        { label: t.plan.viewOriginal, onPress: () => router.push('/original') },
        {
          label: t.plan.removeFromDevice,
          destructive: true,
          // Opens the confirmation as a second menu (this one has closed by then).
          onPress: () =>
            setMenu(
              removeTripMenu(t, stored, () => {
                useStore.getState().removeTrip(trip.id);
                router.navigate('/');
              }),
            ),
        },
      ],
    });

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={trip.title}
        subtitle={tripSummary(trip.plan.events.filter((e) => e.type === 'day'), LANGUAGES[lang].locale, t.common.days)}
        titleLines={2}
      />
      <View style={styles.actions}>
        <ActionChip icon="share-outline" label={t.plan.share} onPress={() => setShareOpen(true)} />
        <ActionChip icon="people-outline" label={t.plan.participants} onPress={() => router.push('/participants')} />
        <ActionChip icon="ellipsis-horizontal" accessibilityLabel={t.plan.moreActions} onPress={moreMenu} />
      </View>
      <SyncBanner />
      {unavailable ? (
        <Banner text={t.plan.unavailable} tone="warning" icon="cloud-offline-outline" />
      ) : null}
      {visibleNote ? <Banner text={visibleNote} icon="sparkles-outline" onDismiss={() => setNote(null)} /> : null}
      {switchError ? <Banner text={switchError} tone="warning" onDismiss={() => setSwitchError(null)} /> : null}
      {isOwner && (trip.can_undo || trip.can_redo) ? (
        <View style={styles.undoBar}>
          {trip.can_undo ? (
            <Button
              title={t.plan.undo}
              variant="secondary"
              icon="arrow-undo-outline"
              onPress={() => void switchVersion('undo')}
              loading={switching === 'undo'}
              disabled={switching !== null}
              style={styles.undoButton}
            />
          ) : null}
          {trip.can_redo ? (
            <Button
              title={t.plan.redo}
              variant="secondary"
              icon="arrow-redo-outline"
              onPress={() => void switchVersion('redo')}
              loading={switching === 'redo'}
              disabled={switching !== null}
              style={styles.undoButton}
            />
          ) : null}
        </View>
      ) : null}
      {trip.plan.events.length === 0 ? (
        <AppText variant="muted" style={styles.emptyText}>
          {t.plan.noDays}
        </AppText>
      ) : (
        // key: switching trips resets the open day and the scroll position.
        <PlanView key={trip.id} plan={trip.plan} refreshing={refreshing} onRefresh={onRefresh} />
      )}
      <ShareModal visible={shareOpen} title={trip.title} code={trip.share_code} onClose={() => setShareOpen(false)} />
      <ActionMenu menu={menu} onClose={() => setMenu(null)} />
      <RefineModal visible={refineOpen} onSubmit={refine} onClose={() => setRefineOpen(false)} />
    </View>
  );
}

/** Empty state when the tab is opened before any trip. */
function NoTripOpen() {
  const t = useT();
  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.tabs.tripPlan} />
      <EmptyState icon="map-outline" title={t.plan.noTripTitle} text={t.plan.noTripText}>
        <Button title={t.plan.goToMyTrips} onPress={() => router.navigate('/')} />
      </EmptyState>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  actions: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  undoBar: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  undoButton: { flex: 1 },
  emptyText: { padding: spacing.xl, textAlign: 'center' },
});
