// Shared request/response helpers for Edge Functions.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/** Wraps a JSON POST handler with CORS, body parsing, and uniform error responses. */
export function handler(fn: (body: Record<string, unknown>) => Promise<unknown>) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
    if (req.method !== "POST") return json({ error: { code: "method", message: "Use POST" } }, 405);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: { code: "bad_json", message: "Body must be JSON" } }, 400);
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return json({ error: { code: "bad_json", message: "Body must be a JSON object" } }, 400);
    }

    try {
      return json(await fn(body as Record<string, unknown>));
    } catch (err) {
      if (err instanceof HttpError) {
        return json({ error: { code: err.code, message: err.message } }, err.status);
      }
      console.error(err);
      return json({ error: { code: "internal", message: "Something went wrong. Please try again." } }, 500);
    }
  };
}

export function str(body: Record<string, unknown>, key: string): string | undefined {
  const v = body[key];
  return typeof v === "string" ? v : undefined;
}
