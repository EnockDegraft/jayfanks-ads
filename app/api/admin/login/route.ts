import {
  THROTTLE_MINUTES,
  createSession,
  getDummyHash,
  isLoginThrottled,
  recordLoginAttempt
} from "@/lib/auth";
import { getDb } from "@/lib/db";
import { NO_STORE, clientIp, describeError, isSameOrigin, jsonError, readJson } from "@/lib/http";
import { verifyPassword } from "@/lib/password";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Forbidden.");

  const { body, error } = await readJson(request, 1_000);
  if (error) return error;

  const data = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";
  if (!email || email.length > 254 || !password || password.length > 200) {
    return jsonError(400, "Enter your email and password.");
  }

  const ip = clientIp(request);

  try {
    if (await isLoginThrottled(email, ip)) {
      return jsonError(429, `Too many sign-in attempts. Try again in ${THROTTLE_MINUTES} minutes.`, {
        "Retry-After": String(THROTTLE_MINUTES * 60)
      });
    }

    const sql = getDb();
    const [admin] = await sql<{ id: string; passwordHash: string }[]>`
      select id, password_hash as "passwordHash" from admin_users where email = ${email}
    `;
    const passwordMatches = await verifyPassword(password, admin?.passwordHash ?? (await getDummyHash()));
    const succeeded = Boolean(admin) && passwordMatches;

    await recordLoginAttempt(email, ip, succeeded);
    if (!succeeded) return jsonError(401, "Incorrect email or password.");

    await createSession(admin.id);
    return Response.json({ admin: { email } }, { headers: NO_STORE });
  } catch (err) {
    console.error("Admin sign-in failed:", describeError(err));
    return jsonError(500, "Sign-in is unavailable right now. Please try again.");
  }
}
