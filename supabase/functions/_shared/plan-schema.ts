// The plan shape: the contract between the model, the database, and the app.
// The app keeps a matching TypeScript copy in mobile/src/types/plan.ts — keep them in sync.
import { z } from "npm:zod@^4.5.0";

const nullableText = z.string().nullable();

// ISO date (YYYY-MM-DD). Kept as a plain string: the SDK strips unsupported
// constraints anyway, and we validate the format ourselves in postProcess.
const isoDate = z.string().nullable().describe("YYYY-MM-DD, or null if not determinable");

export const ExtractedActivity = z.object({
  name: z.string().describe("Activity or place name, as written in the source"),
  time: nullableText.describe('Only if stated in the source: "09:00", "morning", "after lunch". Else null'),
  notes: nullableText.describe("Short summary of details the source gives for this activity. Else null"),
  place_query: nullableText.describe('"<place>, <city>" for a map search; null if not a physical place'),
});

const ArrivalOrDeparture = {
  date: isoDate,
  time: nullableText,
  location: nullableText,
  notes: nullableText,
};

export const ExtractedEvent = z.discriminatedUnion("type", [
  z.object({ type: z.literal("arrival"), ...ArrivalOrDeparture }),
  z.object({
    type: z.literal("day"),
    day_number: z.number().int(),
    date: isoDate,
    label: nullableText.describe('Short location label for the day node, e.g. "Jerusalem"'),
    city: nullableText.describe("Main city/area of the day"),
    activities: z.array(ExtractedActivity),
  }),
  z.object({
    type: z.literal("transit"),
    mode: z.enum(["flight", "drive", "train", "bus", "ferry", "other"]),
    from: nullableText,
    to: nullableText,
    date: isoDate,
    time: nullableText,
    notes: nullableText,
  }),
  z.object({ type: z.literal("departure"), ...ArrivalOrDeparture }),
]);

export const ExtractedPlan = z.object({
  title: z.string(),
  events: z.array(ExtractedEvent),
});

export const RefineResult = z.object({
  changed: z.boolean().describe("false if the instruction could not be applied"),
  note: nullableText.describe("Short note for the user: the assumption made or why nothing could be applied, else null"),
  plan: ExtractedPlan,
});

export type ExtractedPlan = z.infer<typeof ExtractedPlan>;
export type ExtractedEvent = z.infer<typeof ExtractedEvent>;

// Stored plan: same as extracted, plus server-assigned activity ids.
export type Activity = z.infer<typeof ExtractedActivity> & { id: string };
export type DayEvent = Extract<ExtractedEvent, { type: "day" }>;
export type PlanEvent =
  | Exclude<ExtractedEvent, { type: "day" }>
  | (Omit<DayEvent, "activities"> & { activities: Activity[] });
export type Plan = { title: string; events: PlanEvent[] };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class PlanCheckError extends Error {}

/** Checks the model output and turns it into a stored Plan (ids, day numbering, clean dates). */
export function postProcess(extracted: ExtractedPlan): Plan {
  const days = extracted.events.filter((e) => e.type === "day");
  if (days.length === 0) throw new PlanCheckError("No days found in the plan");

  let dayNumber = 0;
  const events = extracted.events.map((event): PlanEvent => {
    const date = event.date && ISO_DATE.test(event.date) ? event.date : null;
    if (event.type !== "day") return { ...event, date };
    dayNumber += 1;
    const n = dayNumber;
    return {
      ...event,
      date,
      day_number: n,
      activities: event.activities.map((a, i) => ({ ...a, id: `d${n}-a${i + 1}` })),
    };
  });

  return { title: extracted.title.trim() || "My trip", events };
}

/** Plan without server ids, used as model input for refinement. */
export function stripIds(plan: Plan): ExtractedPlan {
  return {
    title: plan.title,
    events: plan.events.map((e) =>
      e.type === "day" ? { ...e, activities: e.activities.map(({ id: _id, ...a }) => a) } : e
    ),
  };
}
