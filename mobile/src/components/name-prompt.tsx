import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Dialog } from '@/components/overlays';
import { AppText, Button, textInputStyle } from '@/components/ui';
import { useT } from '@/i18n';
import { contentTextStyle } from '@/lib/rtl';
import { theme } from '@/theme';

type Props = { visible: boolean; initial: string; onDone: (name: string) => void };

/** Asks for the display name once, before the first trip is created. Can be skipped (empty name). */
export function NamePrompt({ visible, initial, onDone }: Props) {
  const t = useT();
  const [name, setName] = useState(initial);
  // No tap-outside close: the user picks Continue or Skip (Android back counts as Skip).
  return (
    <Dialog visible={visible} onClose={() => onDone('')} closeOnBackdrop={false}>
      <AppText variant="heading">{t.namePrompt.title}</AppText>
      <AppText variant="muted">{t.namePrompt.hint}</AppText>
      <TextInput
        style={[textInputStyle, styles.input, contentTextStyle(name)]}
        value={name}
        onChangeText={setName}
        maxLength={40}
        placeholder={t.namePrompt.placeholder}
        placeholderTextColor={theme.colors.textMuted}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => onDone(name.trim())}
      />
      <Button title={t.namePrompt.continue} onPress={() => onDone(name.trim())} />
      <Button title={t.namePrompt.skip} variant="secondary" onPress={() => onDone('')} />
    </Dialog>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: theme.size.touch },
});
