// Modal building blocks: a centered Dialog and a BottomSheet. Both close on tap outside and on Android back.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { theme } from '@/theme';

const { colors, spacing, radius, size, motion } = theme;
const useNativeDriver = Platform.OS !== 'web';

type DialogProps = {
  visible: boolean;
  /** Called on tap outside and on Android back. */
  onClose: () => void;
  /** False: a tap outside does nothing (Android back still calls onClose). */
  closeOnBackdrop?: boolean;
  cardStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** Centered card over a dimmed backdrop. Moves up with the keyboard on iOS. */
export function Dialog({ visible, onClose, closeOnBackdrop = true, cardStyle, children }: DialogProps) {
  const t = useT();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} disabled={!closeOnBackdrop} accessibilityLabel={t.common.close} />
      <KeyboardAvoidingView
        pointerEvents="box-none"
        style={styles.center}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.card, cardStyle]}>{children}</View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Called once the sheet has finished sliding out (e.g. to open something else afterwards). */
  onHidden?: () => void;
  /** Adds the grab handle at the top. */
  handle?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** Sheet that slides up from the bottom while the backdrop fades in (not the whole screen sliding). */
export function BottomSheet({ visible, onClose, onHidden, handle, style, children }: BottomSheetProps) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // 0 = hidden, 1 = shown. Created once (useState, not a ref read during render).
  const [progress] = useState(() => new Animated.Value(0));
  // Stays mounted after `visible` turns false, until the slide-out animation ends.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  const onHiddenRef = useRef(onHidden);
  useEffect(() => {
    onHiddenRef.current = onHidden;
  });

  useEffect(() => {
    if (!mounted) return;
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? motion.in : motion.out,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
        onHiddenRef.current?.();
      }
    });
    return () => animation.stop();
  }, [visible, mounted, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });
  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Animated.View style={[styles.backdrop, { opacity: progress }]}>
          <Pressable style={styles.fill} onPress={onClose} accessibilityLabel={t.common.close} />
        </Animated.View>
        <Animated.View
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md, transform: [{ translateY }] }, style]}>
          {handle ? <View style={styles.handle} /> : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  fill: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: size.handleWidth,
    height: size.handleHeight,
    borderRadius: size.handleHeight / 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
});
