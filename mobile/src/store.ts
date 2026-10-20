import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { deviceCodes } from '@/i18n/device';
import { pickLanguage } from '@/i18n/detect';
import type { Lang } from '@/i18n/languages';
import type { Trip } from '@/types/plan';

export type Role = 'owner' | 'viewer';
/** Result of the last refetch: `offline` = no answer (network/timeout), `error` = the server failed. */
export type SyncStatus = 'ok' | 'offline' | 'error';
export type StoredTrip = { trip: Trip; role: Role; fetchedAt: number; unavailable?: boolean };

type State = {
  trips: Record<string, StoredTrip>;
  lastOpenedTripId: string | null;
  displayName: string;
  /** True once we have asked for the display name (it may have been skipped). */
  namePrompted: boolean;
  /** UI language. Starts as the device language when supported, else English. */
  lang: Lang;
  /** True once the user confirmed a language (first-launch picker or Settings). */
  langChosen: boolean;
  /** Not persisted: how the last refetch went. When not `ok`, cached copies are shown. */
  syncStatus: SyncStatus;

  /** Adds a trip, or updates the cached copy. An existing owner role is never downgraded. */
  upsertTrip: (trip: Trip, role: Role) => void;
  /** Merges a refetch: updates fetched trips, marks the missing ones as unavailable. */
  applyRefetch: (trips: Trip[], missingCodes: string[]) => void;
  removeTrip: (tripId: string) => void;
  setLastOpened: (tripId: string | null) => void;
  setDisplayName: (name: string) => void;
  markNamePrompted: () => void;
  /** Sets the UI language and marks it as chosen. */
  setLang: (lang: Lang) => void;
  /** Switches the language without marking it chosen (live preview in the first-launch picker). */
  previewLang: (lang: Lang) => void;
  markLangChosen: () => void;
  setSyncStatus: (status: SyncStatus) => void;
};

type PersistedState = Pick<State, 'trips' | 'lastOpenedTripId' | 'displayName' | 'namePrompted' | 'lang' | 'langChosen'>;

export const useStore = create<State>()(
  persist(
    (set) => ({
      trips: {},
      lastOpenedTripId: null,
      displayName: '',
      namePrompted: false,
      lang: pickLanguage(deviceCodes()),
      langChosen: false,
      syncStatus: 'ok',

      upsertTrip: (trip, role) =>
        set((s) => {
          const existing = s.trips[trip.id];
          const finalRole: Role = existing?.role === 'owner' ? 'owner' : role;
          return {
            trips: { ...s.trips, [trip.id]: { trip, role: finalRole, fetchedAt: Date.now() } },
          };
        }),

      applyRefetch: (fetched, missingCodes) =>
        set((s) => {
          const trips = { ...s.trips };
          for (const trip of fetched) {
            const existing = trips[trip.id];
            if (existing) trips[trip.id] = { ...existing, trip, fetchedAt: Date.now(), unavailable: false };
          }
          for (const id of Object.keys(trips)) {
            if (missingCodes.includes(trips[id].trip.share_code)) trips[id] = { ...trips[id], unavailable: true };
          }
          return { trips, syncStatus: 'ok' };
        }),

      removeTrip: (tripId) =>
        set((s) => {
          const { [tripId]: _removed, ...rest } = s.trips;
          return { trips: rest, lastOpenedTripId: s.lastOpenedTripId === tripId ? null : s.lastOpenedTripId };
        }),

      setLastOpened: (tripId) => set({ lastOpenedTripId: tripId }),
      setDisplayName: (displayName) => set({ displayName: displayName.trim(), namePrompted: true }),
      markNamePrompted: () => set({ namePrompted: true }),
      setLang: (lang) => set({ lang, langChosen: true }),
      previewLang: (lang) => set({ lang }),
      markLangChosen: () => set({ langChosen: true }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
    }),
    {
      name: 'tripplan-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Bump `version` on any change to the persisted shape and handle the old shape in `migrate`.
      // Without a migrate step, zustand drops saved state whose version doesn't match.
      // v0 → v1: same shape (the version was only made explicit).
      // v1 → v2: adds `lang` (device language if supported) and `langChosen: false`, so the picker shows once.
      version: 2,
      migrate: (persisted, version) => {
        const old = persisted as Omit<PersistedState, 'lang' | 'langChosen'>;
        if (version < 2) return { ...old, lang: pickLanguage(deviceCodes()), langChosen: false } as PersistedState;
        return persisted as PersistedState;
      },
      partialize: (s): PersistedState => ({
        trips: s.trips,
        lastOpenedTripId: s.lastOpenedTripId,
        displayName: s.displayName,
        namePrompted: s.namePrompted,
        lang: s.lang,
        langChosen: s.langChosen,
      }),
    },
  ),
);

/** Trips sorted by most recently updated first. */
export function sortedTrips(trips: Record<string, StoredTrip>): StoredTrip[] {
  return Object.values(trips).sort((a, b) => b.trip.updated_at.localeCompare(a.trip.updated_at));
}
