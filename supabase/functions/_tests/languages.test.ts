import { assertEquals } from "jsr:@std/assert@1";
import { AI_LANGUAGES, resolveLang } from "../_shared/languages.ts";

Deno.test("resolveLang accepts known languages", () => {
  assertEquals(resolveLang("en"), "en");
  assertEquals(resolveLang("he"), "he");
});

Deno.test("resolveLang falls back to English for anything else", () => {
  for (const x of ["fr", "", "HE", "toString", "__proto__", undefined, null, 5, {}, ["he"]]) {
    assertEquals(resolveLang(x), "en", String(x));
  }
  assertEquals(AI_LANGUAGES.he, "Hebrew");
});
