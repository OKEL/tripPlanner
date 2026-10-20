// Service-role database access. Only Edge Functions talk to the tables (RLS has no policies).
import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import type { Plan } from "./plan-schema.ts";
import { HttpError } from "./http.ts";

export const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

export type TripRow = {
  id: string;
  share_code: string;
  title: string;
  creator_name: string | null;
  source_text: string;
  source_kind: "text" | "pdf";
  plan: Plan;
  previous_plan: Plan | null;
  redo_plan: Plan | null;
  owner_token_hash: string;
  created_at: string;
  updated_at: string;
};

/** Columns the functions read. Everything except the owner token hash, which only refine-trip needs. */
export const PUBLIC_COLUMNS =
  "id, share_code, title, creator_name, source_text, source_kind, plan, previous_plan, redo_plan, created_at, updated_at";

/** A UUID, so a malformed trip id is a clean 404 instead of a Postgres cast error. */
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PublicRow = Omit<TripRow, "owner_token_hash">;

/** Public shape returned to the app. Never includes the owner token hash. */
export function publicTrip(row: PublicRow) {
  return {
    id: row.id,
    share_code: row.share_code,
    title: row.title,
    creator_name: row.creator_name,
    source_text: row.source_text,
    source_kind: row.source_kind,
    plan: row.plan,
    can_undo: row.previous_plan !== null,
    can_redo: row.redo_plan !== null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function dbError(err: { message: string }): never {
  console.error("db error:", err.message);
  throw new HttpError(500, "db", "Could not reach the database. Please try again.");
}
