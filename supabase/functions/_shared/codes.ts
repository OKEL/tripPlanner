// Share codes and owner tokens.

// No 0/O, 1/I/L: codes are typed by hand from a WhatsApp message.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;

export function newShareCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  // 256 % 31 bias is negligible for share codes.
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

/** Uppercases and drops anything outside the alphabet (spaces, dashes). */
export function normalizeShareCode(input: string): string {
  return input.toUpperCase().split("").filter((c) => CODE_ALPHABET.includes(c)).join("");
}

export function newOwnerToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
