import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const SESSION_HOURS = 12;
const isProduction = process.env.NODE_ENV === "production";

// The __Host- prefix makes browsers refuse the cookie unless it is Secure, host-only and Path=/.
export const SESSION_COOKIE = isProduction ? "__Host-jf_admin" : "jf_admin";

const cookieOptions = {
  httpOnly: true, // not readable from page JavaScript
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/"
};

export type AdminSession = {
  adminId: string;
  email: string;
  expiresAt: Date;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Starts a new session for the admin and sets the session cookie. */
export async function createSession(adminId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const sql = getDb();
  await sql`
    insert into admin_sessions (token_hash, admin_id, expires_at)
    values (${hashToken(token)}, ${adminId}, now() + make_interval(hours => ${SESSION_HOURS}::int))
  `;
  (await cookies()).set(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_HOURS * 60 * 60 });
}

/**
 * Returns the signed-in admin, or null. Use this in every admin route handler, and in
 * server components or server actions under /admin, before touching customer data.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;

  const sql = getDb();
  const [session] = await sql<AdminSession[]>`
    select u.id as "adminId", u.email, s.expires_at as "expiresAt"
    from admin_sessions s
    join admin_users u on u.id = s.admin_id
    where s.token_hash = ${hashToken(token)} and s.expires_at > now()
  `;
  return session ?? null;
}

/** Deletes the current session from the database and clears the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const sql = getDb();
    await sql`delete from admin_sessions where token_hash = ${hashToken(token)}`;
  }
  // Overwrite with the same attributes; a plain delete can't clear a __Host- cookie.
  store.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

// --- Sign-in throttling -------------------------------------------------------

const MAX_FAILURES_PER_EMAIL = 5;
const MAX_FAILURES_PER_IP = 20;
export const THROTTLE_MINUTES = 15;

/** True when there have been too many recent failed sign-ins for this email or IP. */
export async function isLoginThrottled(email: string, ip: string | null): Promise<boolean> {
  const sql = getDb();
  const [counts] = await sql<{ emailFailures: string; ipFailures: string }[]>`
    select
      (select count(*) from admin_login_attempts
        where email = ${email} and not succeeded
          and created_at > greatest(
            now() - make_interval(mins => ${THROTTLE_MINUTES}::int),
            (select coalesce(max(created_at), '-infinity') from admin_login_attempts
              where email = ${email} and succeeded)
          )) as "emailFailures",
      (select count(*) from admin_login_attempts
        where ip = ${ip} and not succeeded
          and created_at > now() - make_interval(mins => ${THROTTLE_MINUTES}::int)) as "ipFailures"
  `;
  return (
    Number(counts.emailFailures) >= MAX_FAILURES_PER_EMAIL ||
    Number(counts.ipFailures) >= MAX_FAILURES_PER_IP
  );
}

export async function recordLoginAttempt(email: string, ip: string | null, succeeded: boolean) {
  const sql = getDb();
  await sql`insert into admin_login_attempts (email, ip, succeeded) values (${email}, ${ip}, ${succeeded})`;
  if (succeeded) {
    // Housekeeping on the (rare) successful sign-in.
    await sql`delete from admin_sessions where expires_at < now()`;
    await sql`delete from admin_login_attempts where created_at < now() - interval '90 days'`;
  }
}

// Checked against when the email is unknown, so response time doesn't reveal which emails exist.
let dummyHash: Promise<string> | undefined;
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}
