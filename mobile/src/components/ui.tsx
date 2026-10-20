import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { contentTextStyle } from '@/lib/rtl';
import { theme } from '@/theme';

const { colors, font, spacing, radius, size, opacity } = theme;

export type IconName = ComponentProps<typeof Ionicons>['name'];

type Variant = 'body' | 'small' | 'muted' | 'title' | 'heading' | 'label';

/** UI text (English chrome). For trip content use `ContentText` so each string gets its own direction. */
export function AppText({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  return <Text style={[textStyles[variant], style]} {...rest} />;
}

const textStyles = StyleSheet.create({
  body: { fontSize: font.size.md, color: colors.text, fontFamily: font.regular },
  small: { fontSize: font.size.sm, color: colors.text, fontFamily: font.regular },
  muted: { fontSize: font.size.sm, color: colors.textMuted, fontFamily: font.regular },
  title: { fontSize: font.size.xl, fontFamily: font.bold, color: colors.text },
  heading: { fontSize: font.size.lg, fontFamily: font.bold, color: colors.text },
  label: { fontSize: font.size.sm, fontFamily: font.medium, color: colors.textMuted },
});

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = 'primary', icon, disabled, loading, style }: ButtonProps) {
  const inactive = disabled || loading;
  const filled = variant !== 'secondary';
  const background = !filled ? colors.surface : variant === 'danger' ? colors.danger : colors.primary;
  const textColor = filled ? colors.onPrimary : colors.primary;
  const contentColor = inactive && !filled ? colors.disabled : textColor;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        buttonStyles.base,
        { backgroundColor: inactive && filled ? colors.disabled : background, opacity: pressed ? opacity.pressed : 1 },
        !filled && buttonStyles.outline,
        style,
      ]}>
      {loading ? <ActivityIndicator color={textColor} /> : null}
      {icon && !loading ? <Ionicons name={icon} size={18} color={contentColor} /> : null}
      <Text style={[buttonStyles.text, { color: contentColor }]}>{title}</Text>
    </Pressable>
  );
}

const buttonStyles = StyleSheet.create({
  base: {
    minHeight: size.touch,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  outline: { borderWidth: 1, borderColor: colors.border },
  text: { fontSize: font.size.md, fontFamily: font.bold },
});

/** Small text-style button for header actions. */
export function LinkButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} onPress={onPress} disabled={disabled} hitSlop={8}>
      <Text style={[linkStyles.text, disabled && { color: colors.disabled }]}>{title}</Text>
    </Pressable>
  );
}

const linkStyles = StyleSheet.create({
  text: { fontSize: font.size.md, fontFamily: font.medium, color: colors.primary },
});

/** Round icon-only button (e.g. "⋯" on a card). `label` is read by screen readers. */
export function IconButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [iconButtonStyles.button, pressed && { backgroundColor: colors.background }]}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const iconButtonStyles = StyleSheet.create({
  button: { width: size.chip, height: size.chip, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});

/** Custom header for screens that hide the navigator header. */
export function ScreenHeader({
  title,
  subtitle,
  right,
  titleLines = 1,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  titleLines?: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[headerStyles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={headerStyles.titleBox}>
        <AppText variant="title" accessibilityRole="header" style={[contentTextStyle(title)]} numberOfLines={titleLines}>
          {title}
        </AppText>
        {subtitle ? <AppText variant="muted">{subtitle}</AppText> : null}
      </View>
      {right ? <View style={headerStyles.right}>{right}</View> : null}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  titleBox: { flex: 1, gap: spacing.xxs },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
});

/** Compact action pill (icon and/or label) for the row under a screen header. */
export function ActionChip({
  label,
  icon,
  accessibilityLabel,
  onPress,
}: {
  label?: string;
  icon: IconName;
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [chipStyles.chip, pressed && { opacity: opacity.pressed }]}>
      <Ionicons name={icon} size={18} color={colors.primaryText} />
      {label ? <Text style={chipStyles.text}>{label}</Text> : null}
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: size.chip,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  text: { fontSize: font.size.sm, fontFamily: font.medium, color: colors.primaryText },
});

/** Small rounded label, e.g. "Owner" or "Demo". */
export function Pill({ text }: { text: string }) {
  return (
    <View style={pillStyles.pill}>
      <AppText variant="small" style={pillStyles.text}>
        {text}
      </AppText>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xxs },
  text: { color: colors.primaryText, fontFamily: font.bold },
});

const BANNER_TONES = {
  info: { background: colors.accent, text: colors.text, icon: 'information-circle-outline' },
  warning: { background: colors.warning, text: colors.warningText, icon: 'alert-circle-outline' },
} as const;

export function Banner({
  text,
  tone = 'info',
  icon,
  onDismiss,
}: {
  text: string;
  tone?: keyof typeof BANNER_TONES;
  icon?: IconName;
  onDismiss?: () => void;
}) {
  const t = useT();
  const look = BANNER_TONES[tone];
  return (
    <View style={[bannerStyles.box, { backgroundColor: look.background }]} accessibilityRole="alert">
      <Ionicons name={icon ?? look.icon} size={18} color={look.text} />
      <AppText variant="small" style={[bannerStyles.text, { color: look.text }]}>
        {text}
      </AppText>
      {onDismiss ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t.common.dismiss} onPress={onDismiss} hitSlop={12}>
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  text: { flex: 1 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});

/** Centered empty state: icon in a soft circle, title, text, and optional buttons below. */
export function EmptyState({ icon, title, text, children }: { icon: IconName; title: string; text: string; children?: ReactNode }) {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.icon}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <AppText variant="heading" style={emptyStyles.title}>
        {title}
      </AppText>
      <AppText variant="muted" style={emptyStyles.text}>
        {text}
      </AppText>
      {children}
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'stretch', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  icon: {
    alignSelf: 'center',
    width: size.emptyIcon,
    height: size.emptyIcon,
    borderRadius: size.emptyIcon / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { textAlign: 'center' },
  text: { textAlign: 'center', marginBottom: spacing.md },
});

/** Base style for every text field. Screens add only size and layout. */
export const textInputStyle: TextStyle = {
  fontSize: font.size.md,
  color: colors.text,
  fontFamily: font.regular,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  paddingHorizontal: spacing.md,
};
