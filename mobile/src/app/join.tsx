import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';

import { errorMessage, getTrips } from '@/api';
import { AppText, Button, textInputStyle } from '@/components/ui';
import { allCodeLabels, useT } from '@/i18n';
import { CODE_LENGTH, extractShareCode, normalizeShareCode } from '@/lib/codes';
import { getOwnerToken } from '@/lib/tokens';
import { useStore } from '@/store';
import { theme } from '@/theme';

const { colors, spacing, font } = theme;

export default function JoinTrip() {
  const t = useT();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const code = normalizeShareCode(input);
  const canJoin = code.length === CODE_LENGTH && !busy;

  const openTrip = (tripId: string) => {
    useStore.getState().setLastOpened(tripId);
    router.dismissAll();
    router.navigate('/plan');
  };

  const join = async () => {
    setError(null);
    // Already on this device (including the owner entering their own code): just open it.
    const existing = Object.values(useStore.getState().trips).find((t) => t.trip.share_code === code);
    if (existing) return openTrip(existing.trip.id);

    setBusy(true);
    try {
      const { trips } = await getTrips([code]);
      const trip = trips[0];
      if (!trip) {
        setError(t.join.notFound);
        setBusy(false);
        return;
      }
      // A kept owner token (the trip was removed from this device earlier) restores the owner role.
      const role = (await getOwnerToken(trip.id)) ? 'owner' : 'viewer';
      useStore.getState().upsertTrip(trip, role);
      openTrip(trip.id);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppText variant="muted">{t.join.hint}</AppText>
      <TextInput
        style={[textInputStyle, styles.input]}
        value={input}
        // Longer than a typed code means a paste (often the whole share message): keep only the code.
        onChangeText={(v) => setInput(v.length > 12 ? extractShareCode(v, allCodeLabels()) : v.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        placeholder="K7QX3M"
        placeholderTextColor={colors.disabled}
        editable={!busy}
        onSubmitEditing={() => canJoin && void join()}
      />
      {error ? (
        <AppText variant="small" style={styles.error}>
          {error}
        </AppText>
      ) : null}
      <View style={styles.spacer} />
      <Button title={t.join.joinTrip} onPress={() => void join()} disabled={!canJoin} loading={busy} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background },
  input: {
    paddingHorizontal: spacing.lg,
    minHeight: 64,
    fontSize: font.size.code,
    fontFamily: font.bold,
    letterSpacing: 6,
    textAlign: 'center',
  },
  error: { color: colors.danger },
  spacer: { flex: 1 },
});
