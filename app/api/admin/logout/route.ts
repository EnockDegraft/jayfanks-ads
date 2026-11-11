import { destroySession } from "@/lib/auth";
import { NO_STORE, describeError, isSameOrigin, jsonError } from "@/lib/http";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Forbidden.");

  try {
    await destroySession();
  } catch (error) {
    console.error("Admin sign-out failed:", describeError(error));
    return jsonError(500, "Couldn't sign out. Please try again.");
  }
  return Response.json({ ok: true }, { headers: NO_STORE });
}
