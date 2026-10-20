import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/overlays';
import { AppText } from '@/components/ui';
import type { Dict } from '@/i18n';
import type { StoredTrip } from '@/store';
import { theme } from '@/theme';

const { colors, spacing, size, font } = theme;

export type MenuAction = { label: string; onPress: () => void; destructive?: boolean };
export type MenuConfig = { title: string; message?: string; actions: MenuAction[] };

type Props = { menu: MenuConfig | null; onClose: () => void };

/** Bottom menu. Tapping outside it (or the Android back button) closes it: no Cancel needed. */
export function ActionMenu({ menu, onClose }: Props) {
  // Keeps showing the last menu while the sheet slides out.
  const [shown, setShown] = useState(menu);
  if (menu && menu !== shown) setShown(menu);
  // The chosen action runs after the sheet is gone, so it can open another sheet or dialog cleanly.
  const pending = useRef<(() => void) | null>(null);

  const runPending = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };

  return (
    <BottomSheet visible={menu !== null} onClose={onClose} onHidden={runPending}>
      {shown ? (
        <>
          <View style={styles.header}>
            <AppText variant="heading" numberOfLines={2}>
              {shown.title}
            </AppText>
            {shown.message ? <AppText variant="muted">{shown.message}</AppText> : null}
          </View>
          {shown.actions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.background }]}
              onPress={() => {
                pending.current = action.onPress;
                onClose();
              }}>
              <AppText style={[styles.label, action.destructive && { color: colors.danger }]}>{action.label}</AppText>
            </Pressable>
          ))}
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.xs },
  row: { paddingHorizontal: spacing.lg, minHeight: size.touch + spacing.xs, justifyContent: 'center' },
  label: { fontFamily: font.medium },
});

/** Confirmation menu for removing a trip from this device (the trip stays on the server). */
export function removeTripMenu(t: Dict, item: StoredTrip, onRemove: () => void): MenuConfig {
  return {
    title: item.trip.title,
    message: item.role === 'owner' ? t.plan.removeOwnerMessage : t.plan.removeViewerMessage,
    actions: [{ label: t.plan.removeFromDevice, destructive: true, onPress: onRemove }],
  };
}
