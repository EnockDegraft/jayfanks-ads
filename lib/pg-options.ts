// Shared by the app (lib/db.ts) and scripts/*.mjs, so it uses erasable TypeScript only.

/**
 * Connection options for postgres(). Requires TLS for any non-local database unless the
 * URL already sets sslmode (Supabase connection strings don't, and the driver defaults to plain text).
 */
export function connectionOptions(url: string): { ssl?: "require" | false } {
  const { hostname, searchParams } = new URL(url);
  if (searchParams.has("sslmode")) return {};
  const isLocal = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname);
  return { ssl: isLocal ? false : "require" };
}
