import * as SecureStore from 'expo-secure-store';

// Owner tokens live in SecureStore, keyed by trip id. Never in the persisted store.
const key = (tripId: string) => `owner_token.${tripId}`;

export async function saveOwnerToken(tripId: string, token: string): Promise<void> {
  await SecureStore.setItemAsync(key(tripId), token);
}

export async function getOwnerToken(tripId: string): Promise<string | null> {
  return SecureStore.getItemAsync(key(tripId));
}

export async function deleteOwnerToken(tripId: string): Promise<void> {
  await SecureStore.deleteItemAsync(key(tripId));
}
