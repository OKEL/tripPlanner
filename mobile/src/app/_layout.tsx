import { Heebo_400Regular, Heebo_500Medium, Heebo_700Bold, useFonts } from '@expo-google-fonts/heebo';
import { Ionicons } from '@expo/vector-icons';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppText, Button } from '@/components/ui';
import { useT } from '@/i18n';
import { useHydrated } from '@/lib/hydration';
import { useRefetchOnForeground } from '@/lib/sync';
import { theme } from '@/theme';

// Keep the splash screen up until the saved trips and the fonts are loaded (no blank flash).
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const t = useT();
  const hydrated = useHydrated();
  const [fontsLoaded, fontError] = useFonts({ Heebo_400Regular, Heebo_500Medium, Heebo_700Bold });
  // Refetch every trip on app start and whenever the app returns to the foreground.
  useRefetchOnForeground(hydrated);

  // A font failure must not block the app: it falls back to the system font.
  const ready = hydrated && (fontsLoaded || fontError !== null);
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: theme.colors.text,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTitleStyle: { fontFamily: theme.font.bold },
          contentStyle: { backgroundColor: theme.colors.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create" options={{ title: t.screens.newTrip, animation: 'slide_from_right' }} />
        <Stack.Screen name="original" options={{ title: t.screens.originalText }} />
        <Stack.Screen name="participants" options={{ title: t.screens.participants }} />
        <Stack.Screen name="join" options={{ title: t.screens.joinWithCode, presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

/** Shown instead of a crashed screen (expo-router picks up this export). Saved trips are not touched. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const t = useT();
  // The error can happen before the layout above hid the splash screen.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);
  console.error('Screen crashed:', error);
  return (
    <View style={styles.error}>
      <Ionicons name="alert-circle-outline" size={48} color={theme.colors.textMuted} />
      <AppText variant="heading">{t.crash.title}</AppText>
      <AppText variant="muted" style={styles.errorText}>
        {t.crash.text}
      </AppText>
      {__DEV__ ? (
        <AppText variant="small" style={styles.errorText}>
          {error.message}
        </AppText>
      ) : null}
      <Button title={t.crash.retry} onPress={() => void retry()} style={styles.errorButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  errorText: { textAlign: 'center' },
  errorButton: { alignSelf: 'stretch', marginTop: theme.spacing.md },
});
