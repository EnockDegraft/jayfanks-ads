// SMS through the Nalo Solutions API (https://documenter.getpostman.com/view/7705958/Uyr7Hydn).
// Used for the automatic confirmation after a kiosk submission, and by the admin-only
// POST /api/send-sms route. Every attempt and the gateway's response are logged.
import { getDb } from "@/lib/db";
import { products } from "@/lib/products";
import { confirmationMessage, toGhanaMobile } from "@/lib/sms-format";

// const DEFAULT_API_URL = "https://sms.nalosolutions.com/smsbackend/Resl_Nalo/send-message/";

const DEFAULT_API_URL = "https://sms.nalosolutions.com/smsbackend/Resl_Nalo/send-message/";

const SUCCESS = "1701";
const TIMEOUT_MS = 15_000;

export type SmsConfig = {
  url: string;
  senderId: string;
  key: string;
};

export type GatewayResult = {
  status: "sent" | "failed";
  code: string; // 1701 = accepted; 1707, 1025, ... = gateway errors; or "timeout" / "network error"
  jobId: string | null;
  msisdn: string | null; // the phone number the gateway echoed back, or null if it didn't
  httpStatus: number | null;
  response: unknown; // the gateway's reply as JSON (or its raw text), stored in sms_messages.response
};

/** Null until NALO_SMS_KEY and NALO_SMS_SENDER_ID are set; SMS is then switched off. */
export function getSmsConfig(): SmsConfig | null {
  const env = (name: string) => process.env[name]?.trim() || "";
  const senderId = env("NALO_SMS_SENDER_ID");
  const key = env("NALO_SMS_KEY");
  if (!senderId || !key) return null;
  return { url: env("NALO_SMS_URL") || DEFAULT_API_URL, senderId, key };
}

async function callGateway(config: SmsConfig, msisdn: string, message: string): Promise<GatewayResult> {
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ key: config.key, msisdn, message, sender_id: config.senderId }),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    const text = await response.text();
    let body: unknown = text.slice(0, 2_000);
    try {
      body = JSON.parse(text);
    } catch {}

    const fields = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const status = fields.status ?? fields.code;
    if (response.ok && String(status) === SUCCESS) {
      const jobId = typeof fields.job_id === "string" ? fields.job_id : null;
      const msisdn = typeof fields.msisdn === "string" ? fields.msisdn : null;
      return { status: "sent", code: SUCCESS, jobId, msisdn, httpStatus: response.status, response: body };
    }
    // A gateway code such as 1707 (invalid sender) or 1025 (no credit), else the HTTP status and
    // the fields it rejected (not their values, which can include the phone number).
    const code = status !== undefined ? String(status) : `http ${response.status} ${Object.keys(fields).join(",")}`;
    return { status: "failed", code: code.trim().slice(0, 60), jobId: null, msisdn: null, httpStatus: response.status, response: body };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return { status: "failed", code: timedOut ? "timeout" : "network error", jobId: null, msisdn: null, httpStatus: null, response: null };
  }
}

/** The gateway's reply for the server log, without the phone number it echoes back. */
function forLog(response: unknown): string {
  if (typeof response !== "object" || response === null) return JSON.stringify(response);
  const { msisdn: _omitted, ...rest } = response as Record<string, unknown>;
  return JSON.stringify(rest);
}

/** Sends one SMS for an sms_messages row already claimed as 'pending', and records the outcome. */
async function sendAndRecord(
  config: SmsConfig, 
  rowId: string, 
  msisdn: string, 
  message: string, label: string) {
  const result = await callGateway(config, msisdn, message);
  const sql = getDb();
  await sql`
    update sms_messages
    set status = ${result.status}, provider_code = ${result.code}, job_id = ${result.jobId},
        http_status = ${result.httpStatus},
        response = ${result.response === null ? null : JSON.stringify(result.response)}::text::jsonb
    where id = ${rowId}
  `;
  const log = result.status === "sent" ? console.info : console.error;
  log(`SMS ${result.status} (${label}, log #${rowId}): http ${result.httpStatus ?? "-"}, code ${result.code}, gateway reply ${forLog(result.response)}`);
  return result;
}

export type SmsCustomer = { id: string; name: string; email: string; phone: string | null; interests: string[] };

/** Product names for the SMS. Several products share a name, so the size is included. */
function interestNames(interests: string[]): string[] {
  return interests.flatMap((id) => {
    if (id === "all") return ["All products"];
    if (id === "other") return ["Other products"];
    const product = products.find((item) => item.interest === id);
    return product ? [`${product.name} ${product.size}`.trim()] : [];
  });
}

/** The default template: the confirmation every kiosk customer gets, listing their products. */
export function defaultMessage(customer: Pick<SmsCustomer, "name" | "interests">): string {
  return confirmationMessage(customer.name, interestNames(customer.interests));
}

/** Admins never get texts. They're recognised by the email on their admin account. */
export async function isAdminEmail(email: string): Promise<boolean> {
  const sql = getDb();
  const [row] = await sql<{ isAdmin: boolean }[]>`
    select exists (select 1 from admin_users where email = ${email.trim().toLowerCase()}) as "isAdmin"
  `;
  return row.isAdmin;
}

/**
 * Texts a kiosk customer the default template on every submission, with no per-number or
 * daily limit, unless the email belongs to an admin. Every attempt is recorded in sms_messages.
 */
export async function sendSubmissionSms(customer: SmsCustomer) {
  const label = `customer ${customer.id}`;
  const config = getSmsConfig();
  if (!config) return console.info(`SMS skipped (${label}): SMS isn't configured.`);
  if (!customer.phone) return console.info(`SMS skipped (${label}): no phone number.`);

  const msisdn = toGhanaMobile(customer.phone);
  if (!msisdn) return console.info(`SMS skipped (${label}): not a Ghana mobile number.`);
  if (await isAdminEmail(customer.email)) return console.info(`SMS skipped (${label}): admins don't receive SMS.`);

  const sql = getDb();
  const [row] = await sql<{ id: string }[]>`
    insert into sms_messages (customer_id, msisdn, status) values (${customer.id}, ${msisdn}, 'pending')
    returning id
  `;

  return sendAndRecord(config, row.id, msisdn, defaultMessage(customer), label);
}

/** An SMS an admin sends by hand (POST /api/send-sms). No limits; logged with the admin's ID. */
export async function sendAdminSms(
  input: {
    config: SmsConfig;
    adminId: string;
    msisdn: string;
    message: string;
    customerId: string | null;
  }
) {
  const sql = getDb();
  const [row] = await sql<{ id: string }[]>`
    insert into sms_messages (customer_id, admin_id, msisdn, status)
    values (${input.customerId}, ${input.adminId}, ${input.msisdn}, 'pending')
    returning id
  `;
  const result = await sendAndRecord(input.config, row.id, input.msisdn, input.message, `admin ${input.adminId}`);
  return { logId: row.id, ...result };
}
