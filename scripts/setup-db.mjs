// Creates the tables and checks they're locked to the server. Run with: npm run db:setup
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { connectionOptions } from "../lib/pg-options.ts";

const TABLES = ["customers", "admin_users", "admin_sessions", "admin_login_attempts", "sms_messages"];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env or .env.local first (see .env.example).");
  process.exit(1);
}

const sql = postgres(url, {
  ...connectionOptions(url),
  max: 1,
  prepare: false,
  onnotice: () => {},
  connect_timeout: 15
});
try {
  const [{ version }] = await sql`select current_setting('server_version') as version`;
  console.log(`Connected to ${new URL(url).hostname} (Postgres ${version}).`);

  const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  await sql.unsafe(schema).simple();

  const tables = await sql`
    select c.relname as name, c.relrowsecurity as rls,
      exists (select 1 from pg_roles where rolname = 'anon')
        and has_table_privilege('anon', c.oid, 'select') as "anonCanSelect"
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = any(${TABLES}::text[])
    order by c.relname
  `;
  for (const t of tables) {
    console.log(`  ${t.name.padEnd(22)} RLS ${t.rls ? "on " : "OFF"}  public API access: ${t.anonCanSelect ? "YES (!)" : "none"}`);
  }

  const unsafe = tables.filter((t) => !t.rls || t.anonCanSelect);
  if (tables.length !== TABLES.length || unsafe.length > 0) {
    console.error("Some tables are missing or not locked down. Check the output above.");
    process.exitCode = 1;
  } else {
    console.log("Database is ready.");
  }
} catch (error) {
  console.error("Database setup failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
