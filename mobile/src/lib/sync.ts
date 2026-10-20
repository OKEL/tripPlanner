import { useEffect } from 'react';
import { AppState } from 'react-native';

import { getTrips, isNetworkError } from '@/api';
import { useStore } from '@/store';

/** Refetches every trip on this device. On failure keeps the cached copies and records why. */
export async function refreshAll(): Promise<void> {
  const { trips, applyRefetch, setSyncStatus } = useStore.getState();
  const codes = Object.values(trips).map((t) => t.trip.share_code);
  if (codes.length === 0) {
    setSyncStatus('ok');
    return;
  }
  try {
    const { trips: fetched, missing } = await getTrips(codes);
    applyRefetch(fetched, missing);
  } catch (err) {
    setSyncStatus(isNetworkError(err) ? 'offline' : 'error');
  }
}

/** Refetch on mount (app start) and whenever the app returns to the foreground. */
export function useRefetchOnForeground(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    void refreshAll();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshAll();
    });
    return () => sub.remove();
  }, [enabled]);
}
