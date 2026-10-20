import { useSyncExternalStore } from 'react';

import { useStore } from '@/store';

/** True once the persisted store has been read from AsyncStorage. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useStore.persist.onFinishHydration(onChange),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}
