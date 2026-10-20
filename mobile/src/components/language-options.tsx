import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { LANG_CODES, LANGUAGES, type Lang } from '@/i18n';
import { theme } from '@/theme';

const { colors, spacing, radius, size, opacity } = theme;

type Props = { value: Lang; onSelect: (lang: Lang) => void };

/** One row per supported language, each in its own script so it can be found from any UI language. */
export function LanguageOptions({ value, onSelect }: Props) {
  return (
    <View style={styles.list}>
      {LANG_CODES.map((code) => {
        const selected = code === value;
        return (
          <Pressable
            key={code}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={LANGUAGES[code].nativeName}
            onPress={() => onSelect(code)}
            style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && { opacity: opacity.pressed }]}>
            <AppText style={styles.name}>{LANGUAGES[code].nativeName}</AppText>
            <Ionicons
              name={selected ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={selected ? colors.primary : colors.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: size.touch,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowSelected: { borderColor: colors.primary },
  name: { flexShrink: 1 },
});
