// POST { place_query, lang? } → { summary, cached }   (lang: "en" | "he", default "en")
// AI-generated place description for "More info", cached so each place is generated once.
import { describePlace, PLACE_MODEL } from "../_shared/claude.ts";
import { db, dbError } from "../_shared/db.ts";
import { handler, HttpError, str } from "../_shared/http.ts";
import { resolveLang } from "../_shared/languages.ts";

function placeKey(query: string): string {
  return query.toLowerCase().replace(/\s+/g, " ").trim();
}

Deno.serve(handler(async (body) => {
  const query = str(body, "place_query")?.trim();
  if (!query || query.length > 300) throw new HttpError(400, "bad_query", "place_query is required.");
  const key = placeKey(query);
  const lang = resolveLang(body.lang);

  const { data: cached, error } = await db
    .from("place_info")
    .select("summary")
    .eq("place_key", key)
    .eq("lang", lang)
    .maybeSingle<{ summary: string }>();
  if (error) dbError(error);
  if (cached) return { summary: cached.summary, cached: true };

  const summary = await describePlace(query, lang);
  const { error: saveError } = await db
    .from("place_info")
    .upsert({ place_key: key, lang, summary, model: PLACE_MODEL });
  if (saveError) console.error("place_info cache write failed:", saveError.message); // still return it

  return { summary, cached: false };
}));
