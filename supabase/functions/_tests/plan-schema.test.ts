// Run: deno test supabase/functions/_tests (no network, no env needed).
import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { type ExtractedPlan, PlanCheckError, postProcess, stripIds } from "../_shared/plan-schema.ts";

const activity = (name: string) => ({ name, time: null, notes: null, place_query: null });
const day = (n: number, date: string | null, names: string[]) => ({
  type: "day" as const,
  day_number: n,
  date,
  label: null,
  city: null,
  activities: names.map(activity),
});

Deno.test("postProcess renumbers days in order and assigns activity ids", () => {
  const plan = postProcess({
    title: "  Trip  ",
    events: [
      { type: "arrival", date: null, time: "14:30", location: "TLV", notes: null },
      day(5, "2026-10-11", ["A", "B"]),
      { type: "transit", mode: "drive", from: "A", to: "B", date: null, time: null, notes: null },
      day(9, "2026-10-12", ["C"]),
    ],
  });
  assertEquals(plan.title, "Trip");
  const days = plan.events.filter((e) => e.type === "day");
  assertEquals(days.map((d) => d.day_number), [1, 2]);
  assertEquals(days[0].type === "day" && days[0].activities.map((a) => a.id), ["d1-a1", "d1-a2"]);
  assertEquals(days[1].type === "day" && days[1].activities.map((a) => a.id), ["d2-a1"]);
  assertEquals(plan.events[0].type, "arrival"); // order kept
});

Deno.test("postProcess drops dates that are not ISO", () => {
  const plan = postProcess({ title: "T", events: [day(1, "Oct 11", []), day(2, "2026-10-12", [])] });
  assertEquals(plan.events.map((e) => e.date), [null, "2026-10-12"]);
});

Deno.test("postProcess rejects a plan with no days", () => {
  const notAPlan: ExtractedPlan = { title: "T", events: [] };
  assertThrows(() => postProcess(notAPlan), PlanCheckError);
});

Deno.test("postProcess gives an empty title a default", () => {
  assertEquals(postProcess({ title: "  ", events: [day(1, null, [])] }).title, "My trip");
});

Deno.test("stripIds removes only the server ids", () => {
  const plan = postProcess({ title: "T", events: [day(1, null, ["A"])] });
  const stripped = stripIds(plan);
  assertEquals(stripped.events[0], day(1, null, ["A"]));
});
