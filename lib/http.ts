export const NO_STORE = { "Cache-Control": "no-store" };

export function jsonError(status: number, error: string, headers?: HeadersInit) {
  return Response.json({ error }, { status, headers });
}

/** Reads a small JSON request body, or returns the error response to send instead. */
export async function readJson(
  request: Request,
  maxLength = 4_000
): Promise<{ body: unknown; error?: never } | { body?: never; error: Response }> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return { error: jsonError(415, "Send the request as JSON.") };
  }

  const raw = await request.text();
  if (raw.length > maxLength) return { error: jsonError(413, "Request is too large.") };

  try {
    return { body: JSON.parse(raw) };
  } catch {
    return { error: jsonError(400, "Invalid request.") };
  }
}

/** Name, code and message only: full error objects can carry personal data from the query. */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const code = (error as { code?: unknown }).code;
  return [error.name, code, error.message].filter(Boolean).join(": ");
}

/** Blocks cross-site browser requests (CSRF). Requests without an Origin header aren't from a browser form. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || null;
}
