import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';

import { getT } from '@/i18n';

const googleWeb = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

/** Opens the place in a maps app. Android: system chooser. iOS: Google Maps or Apple Maps. */
export async function openInMaps(placeQuery: string): Promise<void> {
  const t = getT();
  const q = encodeURIComponent(placeQuery);
  try {
    if (Platform.OS === 'ios') {
      const options = ['Google Maps', 'Apple Maps', t.common.cancel];
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 2 }, (index) => {
        if (index === 0) void Linking.openURL(googleWeb(placeQuery));
        if (index === 1) void Linking.openURL(`http://maps.apple.com/?q=${q}`);
      });
      return;
    }
    // Android: geo: opens the chooser; fall back to the web URL if nothing handles it.
    try {
      await Linking.openURL(`geo:0,0?q=${q}`);
    } catch {
      await Linking.openURL(googleWeb(placeQuery));
    }
  } catch {
    Alert.alert(t.activity.mapsFailedTitle, t.activity.mapsFailedText);
  }
}
