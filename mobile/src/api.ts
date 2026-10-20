// Edge Function calls. The app never talks to Claude or the database directly.
import { createClient, FunctionsHttpError } from '@supabase/supabase-js';

import { getT } from '@/i18n';
import type { Lang } from '@/i18n/languages';
import type { Trip } from '@/types/plan';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url ?? 'http://missing-env.invalid', anonKey ?? 'missing-env', {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Longer than the server's AI budget (120s, supabase/functions/_shared/claude.ts), so the app
// doesn't give up on a request that is still running and would create the trip anyway.
const TIMEOUT_MS = 150_000;

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

type ErrorContext = 'refine' | 'place';

/**
 * User-facing text for any error from these calls, in the current UI language. Looked up by the error
 * `code`; `context` picks the wording for codes that several calls share. Unknown codes fall back to
 * the server's message, then to a generic one.
 */
export function errorMessage(err: unknown, context?: ErrorContext): string {
  const errors = getT().errors;
  if (!(err instanceof ApiError)) return errors.generic;
  const lookup = (table: Record<string, unknown>) =>
    Object.hasOwn(table, err.code) && typeof table[err.code] === 'string' ? (table[err.code] as string) : undefined;
  return (context && lookup(errors[context])) || lookup(errors) || err.message || errors.generic;
}

/** True when the request never got an answer (no connection or timeout), as opposed to a server error. */
export function isNetworkError(err: unknown): boolean {
  return err instanceof ApiError && (err.code === 'network' || err.code === 'timeout');
}

async function call<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!url || !anonKey) {
    throw new ApiError('config', getT().errors.config);
  }
  const { data, error } = await supabase.functions.invoke(name, { body, timeout: TIMEOUT_MS });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      const apiError = payload?.error;
      throw new ApiError(apiError?.code ?? 'server', apiError?.message ?? getT().errors.generic);
    }
    if (error.name === 'AbortError' || /timed? ?out/i.test(error.message)) {
      throw new ApiError('timeout', getT().errors.timeout);
    }
    throw new ApiError('network', getT().errors.network);
  }
  return data as T;
}

export function createTrip(args: { text?: string; pdfBase64?: string; creatorName?: string; today?: string }) {
  return call<{ trip: Trip; owner_token: string }>('create-trip', {
    text: args.text,
    pdf_base64: args.pdfBase64,
    creator_name: args.creatorName,
    today: args.today,
  });
}

export function getTrips(shareCodes: string[]) {
  return call<{ trips: Trip[]; missing: string[] }>('get-trip', { share_codes: shareCodes });
}

export function refineTrip(args: { tripId: string; ownerToken: string; instruction?: string; undo?: boolean; redo?: boolean; lang?: Lang }) {
  return call<{ trip: Trip; note: string | null; changed?: boolean }>('refine-trip', {
    trip_id: args.tripId,
    owner_token: args.ownerToken,
    instruction: args.instruction,
    undo: args.undo,
    redo: args.redo,
    lang: args.lang,
  });
}

export function getPlaceInfo(placeQuery: string, lang: Lang) {
  return call<{ summary: string; cached: boolean }>('place-info', { place_query: placeQuery, lang });
}
