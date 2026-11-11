import postgres, { type Sql } from "postgres";
import { connectionOptions } from "@/lib/pg-options";

// Reuse one connection pool per server instance (and across hot reloads in dev).
const globalForDb = globalThis as typeof globalThis & { sql?: Sql };

export function getDb(): Sql {
  if (!globalForDb.sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set.");

    globalForDb.sql = postgres(url, {
      ...connectionOptions(url),
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      // Required by Supabase's transaction pooler (port 6543) and similar poolers.
      prepare: false
    });
  }
  return globalForDb.sql;
}
