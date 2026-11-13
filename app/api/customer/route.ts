import { getDb } from "@/lib/db";
import { describeError, jsonError, readJson } from "@/lib/http";
import { interestValues } from "@/lib/products";
import { sendSubmissionSms } from "@/lib/sms";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{6,25}$/;

type CustomerInput = {
  name: string;
  email: string;
  phone: string | null;
  interests: string[];
  consent: true;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Returns the cleaned record, or a message the kiosk can show the customer. */
function validate(body: unknown): CustomerInput | string {
  if (typeof body !== "object" || body === null) return "Invalid request.";
  const data = body as Record<string, unknown>;

  const name = text(data.name);
  const email = text(data.email).toLowerCase();
  const phone = text(data.phone);
  const interests = Array.isArray(data.interests) ? [...new Set(data.interests.map(text))] : [];

  if (!name) return "Please enter your name.";
  if (name.length > 100) return "Please shorten your name to 100 characters or fewer.";
  if (!EMAIL_PATTERN.test(email) || email.length > 254) return "Please enter a valid email address.";
  if (phone && !PHONE_PATTERN.test(phone)) return "Please enter a valid phone number, or leave it blank.";
  if (interests.length === 0) return "Please choose at least one product.";
  if (!interests.every((id) => interestValues.has(id))) return "Please choose products from the list.";
  if (data.consent !== true) return "Please tick the box to agree to be contacted.";

  return { name, email, phone: phone || null, interests, consent: true };
}

/** Public: the kiosk form posts here. */
export async function POST(request: Request) {
  const { body, error } = await readJson(request);
  if (error) return error;

  const result = validate(body);
  if (typeof result === "string") return jsonError(400, result);

  let customerId: string;
  try {
    const sql = getDb();
    const [row] = await sql<{ id: string }[]>`
      insert into customers (name, email, phone, interests, consent)
      values (${result.name}, ${result.email}, ${result.phone}, ${result.interests}::text[], ${result.consent})
      returning id
    `;

    customerId = row.id;
  } catch (err) {
    console.error("Could not save customer:", describeError(err));
    return jsonError(500, "We couldn't save your details. Please try again.");
  }

  // Sent before responding, so the server can't be stopped before the SMS goes out (on Vercel,
  // work left running after the response can be cut off). The gateway call times out after 15s.
  // The real email and products are needed: the email skips admins, the products fill the list.
  // A failed SMS is logged in sms_messages and the server log, and never fails the submission.
  try {
    await sendSubmissionSms({ id: customerId, ...result });
  } catch (err) {
    console.error(`SMS step failed for customer ${customerId}:`, describeError(err));
  }

  return Response.json({ ok: true }, { status: 201 });
}
