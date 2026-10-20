// TypeScript copy of the plan shape in supabase/functions/_shared/plan-schema.ts and of publicTrip() in db.ts.
// Types only: the app trusts what the server has validated. No imports, so the server's contract test
// (supabase/functions/_tests/contract.test.ts) can import this file and fail `deno check` on any drift.

export type Activity = {
  id: string;
  name: string;
  time: string | null;
  notes: string | null;
  place_query: string | null;
};

export type ArrivalEvent = {
  type: 'arrival';
  date: string | null;
  time: string | null;
  location: string | null;
  notes: string | null;
};

export type DepartureEvent = Omit<ArrivalEvent, 'type'> & { type: 'departure' };

export type DayEvent = {
  type: 'day';
  day_number: number;
  date: string | null;
  label: string | null;
  city: string | null;
  activities: Activity[];
};

export type TransitMode = 'flight' | 'drive' | 'train' | 'bus' | 'ferry' | 'other';

export type TransitEvent = {
  type: 'transit';
  mode: TransitMode;
  from: string | null;
  to: string | null;
  date: string | null;
  time: string | null;
  notes: string | null;
};

export type PlanEvent = ArrivalEvent | DayEvent | TransitEvent | DepartureEvent;

export type Plan = { title: string; events: PlanEvent[] };

/** Public trip shape returned by the Edge Functions. */
export type Trip = {
  id: string;
  share_code: string;
  title: string;
  creator_name: string | null;
  source_text: string;
  source_kind: 'text' | 'pdf';
  plan: Plan;
  can_undo: boolean;
  can_redo: boolean;
  created_at: string;
  updated_at: string;
};
