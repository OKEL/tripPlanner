import Constants from 'expo-constants';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { LanguageOptions } from '@/components/language-options';
import { AppText, Button, ScreenHeader, textInputStyle } from '@/components/ui';
import { useLang, useT } from '@/i18n';
import { contentTextStyle } from '@/lib/rtl';
import { useStore } from '@/store';
import { theme } from '@/theme';

const { colors, spacing, radius } = theme;

export default function Settings() {
  const t = useT();
  const lang = useLang();
  const setLang = useStore((s) => s.setLang);
  const displayName = useStore((s) => s.displayName);
  const setDisplayName = useStore((s) => s.setDisplayName);
  const [name, setName] = useState(displayName);
  const dirty = name.trim() !== displayName;

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.settings.title} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText variant="label">{t.settings.displayName}</AppText>
        <TextInput
          style={[textInputStyle, styles.input, contentTextStyle(name)]}
          value={name}
          onChangeText={setName}
          maxLength={40}
          placeholder={t.settings.displayNamePlaceholder}
          placeholderTextColor={colors.textMuted}
        />
        <Button title={t.settings.save} onPress={() => setDisplayName(name)} disabled={!dirty} />

        <AppText variant="label" style={styles.aboutLabel}>
          {t.settings.language}
        </AppText>
        <LanguageOptions value={lang} onSelect={setLang} />
        <AppText variant="muted">{t.settings.languageHint}</AppText>

        <AppText variant="label" style={styles.aboutLabel}>
          {t.settings.about}
        </AppText>
        <View style={styles.about}>
          <AppText variant="heading">TripPlan</AppText>
          <AppText variant="muted">{t.settings.version(Constants.expoConfig?.version ?? '1.0.0')}</AppText>
          <AppText>{t.settings.aboutText}</AppText>
          <AppText variant="muted">{t.settings.aiMistakes}</AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  input: { minHeight: theme.size.touch },
  aboutLabel: { marginTop: spacing.xl },
  about: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm },
});
