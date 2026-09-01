import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let instance: Db | undefined;

// Built lazily (on first query) instead of at module load, so a missing
// DATABASE_URL only breaks the specific request that needed it — it can't
// fail the whole build, which imports every route module (even
// force-dynamic ones) to collect their config.
function getDb(): Db {
  if (!instance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    // prepare: false — required for connection poolers (Neon, Supabase pgbouncer)
    const client = postgres(connectionString, { prepare: false });
    instance = drizzle(client, { schema });
  }
  return instance;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
