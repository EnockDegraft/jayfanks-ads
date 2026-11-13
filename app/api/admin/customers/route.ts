import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { NO_STORE, describeError, jsonError } from "@/lib/http";

const MAX_PAGE_SIZE = 200;

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  interests: string[];
  consent: boolean;
  createdAt: Date;
  smsStatus: "pending" | "sent" | "failed" | null; // latest confirmation SMS; null if none was sent
};

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Customer submissions, newest first. Query: ?page=1&pageSize=50 */
export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return jsonError(401, "Not signed in.", NO_STORE);

    const params = new URL(request.url).searchParams;
    const page = Math.min(positiveInt(params.get("page"), 1), 100_000);
    const pageSize = Math.min(positiveInt(params.get("pageSize"), 50), MAX_PAGE_SIZE);

    const sql = getDb();
    const [customers, [{ total }]] = await Promise.all([
      sql<CustomerRow[]>`
        select c.id, c.name, c.email, c.phone, c.interests, c.consent, c.created_at as "createdAt",
          (select s.status from sms_messages s where s.customer_id = c.id order by s.id desc limit 1)
            as "smsStatus"
        from customers c
        order by c.created_at desc, c.id desc
        limit ${pageSize} offset ${(page - 1) * pageSize}
      `,
      sql<{ total: string }[]>`select count(*) as total from customers`
    ]);

    return Response.json(
      { customers, page, pageSize, total: Number(total) },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error("Loading customers failed:", describeError(error));
    return jsonError(500, "Couldn't load customers.", NO_STORE);
  }
}
