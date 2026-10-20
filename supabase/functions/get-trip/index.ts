// POST { share_codes: string[] } → { trips, missing }
// One code for "Join with code"; all local codes for the refetch on app start / foreground.
import { normalizeShareCode } from "../_shared/codes.ts";
import { db, dbError, PUBLIC_COLUMNS, publicTrip, type PublicRow } from "../_shared/db.ts";
import { handler, HttpError } from "../_shared/http.ts";

Deno.serve(handler(async (body) => {
  const raw = body.share_codes;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 100) {
    throw new HttpError(400, "bad_codes", "share_codes must be a non-empty array.");
  }
  const codes = [...new Set(raw.filter((c) => typeof c === "string").map(normalizeShareCode))];

  const { data, error } = await db
    .from("trips")
    .select(PUBLIC_COLUMNS)
    .in("share_code", codes)
    .returns<PublicRow[]>();
  if (error) dbError(error);

  const found = new Set(data!.map((t) => t.share_code));
  return {
    trips: data!.map(publicTrip),
    missing: codes.filter((c) => !found.has(c)),
  };
}));
