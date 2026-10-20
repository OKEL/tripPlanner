import { Linking, StyleSheet, View } from 'react-native';

import { AppText, Button, Pill } from '@/components/ui';
import { useT } from '@/i18n';
import { theme } from '@/theme';

const { colors, spacing, radius } = theme;

// Demo only: fictional contacts (555-01xx numbers are reserved for fiction).
const PARTICIPANTS = [
  { name: 'Dana Levi', phone: '+1 555 010 0123', wa: '15550100123' },
  { name: 'Noam Cohen', phone: '+1 555 010 0456', wa: '15550100456' },
];

export default function Participants() {
  const t = useT();
  return (
    <View style={styles.screen}>
      <View style={styles.demo}>
        <Pill text={t.common.demo} />
      </View>
      {PARTICIPANTS.map((p) => (
        <View key={p.wa} style={styles.card}>
          <View style={styles.info}>
            <AppText variant="heading">{p.name}</AppText>
            <AppText variant="muted">{p.phone}</AppText>
          </View>
          <Button title={t.participants.whatsapp} icon="logo-whatsapp" variant="secondary" onPress={() => void Linking.openURL(`https://wa.me/${p.wa}`).catch(() => {})} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background },
  demo: { alignSelf: 'flex-start' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  info: { flex: 1, gap: theme.spacing.xxs },
});
