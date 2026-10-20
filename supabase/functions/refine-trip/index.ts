// POST { trip_id, owner_token, instruction, lang? } → { trip, note, changed? }   (apply an instruction; note is in `lang`)
// POST { trip_id, owner_token, undo: true }   → { trip, note }   (restore the previous plan)
// POST { trip_id, owner_token, redo: true }   → { trip, note }   (bring back the plan that was undone)
import { refinePlan } from "../_shared/claude.ts";
import { sha256Hex } from "../_shared/codes.ts";
import { db, dbError, PUBLIC_COLUMNS, publicTrip, type PublicRow, type TripRow, UUID } from "../_shared/db.ts";
import { handler, HttpError, str } from "../_shared/http.ts";
import { resolveLang } from "../_shared/languages.ts";

const MAX_INSTRUCTION = 1000;

Deno.serve(handler(async (body) => {
  const tripId = str(body, "trip_id");
  const ownerToken = str(body, "owner_token");
  if (!tripId || !ownerToken) throw new HttpError(400, "bad_request", "trip_id and owner_token are required.");
  if (!UUID.test(tripId)) throw new HttpError(404, "not_found", "This trip no longer exists.");

  const { data: row, error } = await db.from("trips").select("*").eq("id", tripId).maybeSingle<TripRow>();
  if (error) dbError(error);
  if (!row) throw new HttpError(404, "not_found", "This trip no longer exists.");
  if ((await sha256Hex(ownerToken)) !== row.owner_token_hash) {
    throw new HttpError(403, "not_owner", "Only the trip's creator can change it.");
  }

  let update: Partial<TripRow>;
  let note: string | null = null;

  if (body.undo === true) {
    if (!row.previous_plan) throw new HttpError(409, "nothing_to_undo", "There is nothing to undo.");
    // The undone version is kept so Redo can bring it back without a new AI call.
    update = { plan: row.previous_plan, previous_plan: null, redo_plan: row.plan, title: row.previous_plan.title };
  } else if (body.redo === true) {
    if (!row.redo_plan) throw new HttpError(409, "nothing_to_redo", "There is nothing to redo.");
    update = { plan: row.redo_plan, previous_plan: row.plan, redo_plan: null, title: row.redo_plan.title };
  } else {
    const instruction = str(body, "instruction")?.trim();
    if (!instruction) throw new HttpError(400, "empty", "Tell me what to change.");
    if (instruction.length > MAX_INSTRUCTION) {
      throw new HttpError(413, "too_long", `Keep the instruction under ${MAX_INSTRUCTION} characters.`);
    }
    const result = await refinePlan(row.plan, row.source_text, instruction, resolveLang(body.lang));
    if (!result.changed) return { trip: publicTrip(row), note: result.note, changed: false }; // the app words the no-note case
    update = { plan: result.plan, previous_plan: row.plan, redo_plan: null, title: result.plan.title };
    note = result.note;
  }

  const { data, error: updateError } = await db
    .from("trips")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", tripId)
    .select(PUBLIC_COLUMNS)
    .single<PublicRow>();
  if (updateError) dbError(updateError);
  return { trip: publicTrip(data!), note };
}));
