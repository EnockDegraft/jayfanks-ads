import { getAdminSession } from "@/lib/auth";
import { NO_STORE, describeError, jsonError } from "@/lib/http";

/** Who is signed in. 200 with the admin, or 401. */
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return jsonError(401, "Not signed in.", NO_STORE);
    return Response.json(
      { admin: { email: session.email, expiresAt: session.expiresAt } },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error("Admin session check failed:", describeError(error));
    return jsonError(500, "Couldn't check your session.", NO_STORE);
  }
}
