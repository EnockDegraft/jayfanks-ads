import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { NO_STORE, describeError, isSameOrigin, jsonError, readJson } from "@/lib/http";
import { defaultMessage, getSmsConfig, isAdminEmail, sendAdminSms } from "@/lib/sms";
import { toGhanaMobile } from "@/lib/sms-format";

/**
 * Admin only: send one SMS and get the gateway's response back.
 * Body: { "phone": "024 000 0000", "message": "...", "customerId"?: "12" }
 * With customerId and no phone, the customer's saved phone number is used; with customerId and
 * no message, the default template (the kiosk confirmation) is sent. Admins are never texted.
 *
 * This must never be public: anyone could send any text to any number under the
 * Jay Fanks sender ID, at your expense.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Forbidden.", NO_STORE);

  try {
    const session = await getAdminSession();
    if (!session) return jsonError(401, "Not signed in.", NO_STORE);

    const config = getSmsConfig();
    if (!config) return jsonError(503, "SMS isn't configured. Set NALO_SMS_KEY and NALO_SMS_SENDER_ID.", NO_STORE);

    // Only a guard against oversized requests, not a message length limit.
    const { body, error } = await readJson(request, 100_000);
    if (error) return error;
    const data = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;

    let message = typeof data.message === "string" ? data.message.trim() : "";

    const customerId =
      typeof data.customerId === "string" || typeof data.customerId === "number" ? String(data.customerId) : null;
    if (customerId !== null && !/^\d{1,18}$/.test(customerId)) return jsonError(400, "Invalid customer.", NO_STORE);
    if (!message && !customerId) return jsonError(400, "Enter a message.", NO_STORE);

    let phone = typeof data.phone === "string" ? data.phone : "";
    if (customerId) {
      const sql = getDb();
      const [customer] = await sql<{ name: string; email: string; phone: string | null; interests: string[] }[]>`
        select name, email, phone, interests from customers where id = ${customerId}
      `;
      if (!customer) return jsonError(404, "Customer not found.", NO_STORE);
      if (await isAdminEmail(customer.email)) return jsonError(403, "Admins don't receive SMS.", NO_STORE);
      if (!phone) phone = customer.phone ?? "";
      if (!message) message = defaultMessage(customer);
    }

    const msisdn = toGhanaMobile(phone);
    if (!msisdn) return jsonError(400, "Enter a Ghana mobile number, e.g. 024 000 0000.", NO_STORE);

    const result = await sendAdminSms({ config, adminId: session.adminId, msisdn, message, customerId });
    return Response.json(result, { status: result.status === "sent" ? 200 : 502, headers: NO_STORE });
  } catch (err) {
    console.error("Admin SMS failed:", describeError(err));
    return jsonError(500, "Couldn't send the SMS.", NO_STORE);
  }
}
