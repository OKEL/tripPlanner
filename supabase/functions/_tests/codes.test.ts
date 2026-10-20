import { assert, assertEquals, assertMatch } from "jsr:@std/assert@1";
import { CODE_LENGTH, newOwnerToken, newShareCode, normalizeShareCode, sha256Hex } from "../_shared/codes.ts";
// The app's copy of the share-code helpers (no imports, plain TS): both sides must agree.
import * as app from "../../../mobile/src/lib/codes.ts";

Deno.test("share codes have the right length and only unambiguous characters", () => {
  for (let i = 0; i < 200; i++) {
    const code = newShareCode();
    assertEquals(code.length, CODE_LENGTH);
    assertMatch(code, /^[A-HJKMNP-Z2-9]+$/); // no 0/O, 1/I/L
  }
});

Deno.test("server and app normalize codes the same way", () => {
  assertEquals(app.CODE_LENGTH, CODE_LENGTH);
  for (const input of ["k7q-x3m", " K7Q X3M ", "O0I1L", "abc123xyz", "טיול K7QX3M"]) {
    assertEquals(app.normalizeShareCode(input), normalizeShareCode(input), input);
  }
});

Deno.test("the app finds a server code inside the share message", () => {
  const code = newShareCode();
  assertEquals(app.extractShareCode(`Join my trip 'טיול בישראל' on TripPlan. Code: ${code}`), code);
});

Deno.test("owner tokens are random and URL-safe; the hash is hex SHA-256", async () => {
  const a = newOwnerToken();
  assert(a !== newOwnerToken());
  assertMatch(a, /^[A-Za-z0-9_-]{43}$/);
  assertMatch(await sha256Hex(a), /^[0-9a-f]{64}$/);
});
