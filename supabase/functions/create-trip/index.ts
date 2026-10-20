// POST { text?: string, pdf_base64?: string, creator_name?: string, today?: "YYYY-MM-DD" } → { trip, owner_token }
import { extractText, getDocumentProxy } from "npm:unpdf@1.4.0";
import { extractPlan } from "../_shared/claude.ts";
import { newOwnerToken, newShareCode, sha256Hex } from "../_shared/codes.ts";
import { db, dbError, PUBLIC_COLUMNS, publicTrip, type PublicRow } from "../_shared/db.ts";
import { handler, HttpError, str } from "../_shared/http.ts";

const MAX_CHARS = 20_000;
const MAX_PDF_BYTES = 5 * 1024 * 1024;

async function pdfToText(base64: string): Promise<string> {
  // Check the size from the base64 length (4 chars per 3 bytes) before decoding anything.
  if (base64.length * 0.75 > MAX_PDF_BYTES + 3) throw new HttpError(413, "too_large", "The PDF is too large (max 5 MB).");
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  } catch {
    throw new HttpError(400, "bad_pdf", "Couldn't read this PDF.");
  }
  try {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  } catch (err) {
    console.error("pdf error:", err);
    throw new HttpError(422, "bad_pdf", "Couldn't read this PDF.");
  }
}

Deno.serve(handler(async (body) => {
  const pdfBase64 = str(body, "pdf_base64");
  const sourceKind = pdfBase64 ? "pdf" : "text";
  const sourceText = (pdfBase64 ? await pdfToText(pdfBase64) : str(body, "text") ?? "").trim();

  if (!sourceText) {
    throw pdfBase64
      ? new HttpError(422, "pdf_no_text", "This PDF has no readable text (it may be a scan). Try pasting the text instead.")
      : new HttpError(400, "empty", "Paste your plan first.");
  }
  if (sourceText.length > MAX_CHARS) {
    throw new HttpError(413, "too_long", `The plan is too long (max ${MAX_CHARS.toLocaleString("en")} characters).`);
  }

  const creatorName = str(body, "creator_name")?.trim().slice(0, 40) || null;
  const plan = await extractPlan(sourceText, str(body, "today"));

  const ownerToken = newOwnerToken();
  const ownerTokenHash = await sha256Hex(ownerToken);

  // Retry on the (unlikely) share code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await db
      .from("trips")
      .insert({
        share_code: newShareCode(),
        title: plan.title,
        creator_name: creatorName,
        source_text: sourceText,
        source_kind: sourceKind,
        plan,
        owner_token_hash: ownerTokenHash,
      })
      .select(PUBLIC_COLUMNS)
      .single<PublicRow>();
    if (error?.code === "23505") continue; // unique violation on share_code
    if (error) dbError(error);
    return { trip: publicTrip(data!), owner_token: ownerToken };
  }
  throw new HttpError(500, "code", "Couldn't create a share code. Please try again.");
}));
