// Compile-time contract between the server and the app. `deno check` / `deno test` fail if the
// public trip shape returned by the functions and the app's Trip type drift apart.
import type * as Db from "../_shared/db.ts";
import type { Trip } from "../../../mobile/src/types/plan.ts";

type ServerTrip = ReturnType<typeof Db.publicTrip>;

// Each side must be assignable to the other (same fields, same value types).
const toApp = (t: ServerTrip): Trip => t;
const toServer = (t: Trip): ServerTrip => t;

Deno.test("server and app agree on the trip shape (checked by the type checker)", () => {
  void toApp;
  void toServer;
});
