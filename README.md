# Jay Fanks kiosk

A Next.js App Router kiosk page for Jay Fanks hair and skin care, with an automatic product slideshow and a customer-interest form, plus a password-protected admin page for viewing submissions. The product images and logo are sourced from the Jay Fanks website.

## Run locally

The data lives in Supabase Postgres. The backend connects to the database directly with `DATABASE_URL`; it doesn't use the Supabase publishable key.

```bash
npm install
cp .env.example .env                # then set DATABASE_URL (see below)
npm run db:setup                    # creates the tables and checks they're locked down (safe to re-run)
npm run admin:create -- you@example.com   # prompts for a password (12+ characters)
npm run dev
```

**Getting `DATABASE_URL` from Supabase:** open the project, click **Connect**, pick **Transaction pooler** (port 6543) and copy the URI. Replace `[YOUR-PASSWORD]` with the database password (Project Settings → Database → Reset database password if you don't have it). If the password contains `@ : / ? # %`, URL-encode it. The connection is always encrypted.

The kiosk is at `/`, the admin page at `/admin`. `npm run admin:create` with an existing email resets that admin's password and signs out their sessions. The scripts need Node.js 22.18 or later.

**Production uses its own restricted login, not the owner password.** `npm run db:app-credentials` gives the `kiosk_app` database role a new random password and writes its `DATABASE_URL` to `.env.production.local` (git-ignored). That login can save and read submissions, check admin passwords, and manage sessions. It can't change or delete customers, change admin accounts, or alter tables. Put that value in Vercel as a **Sensitive** variable for Production only. Re-run the command to rotate the password, then update Vercel and redeploy. Keep the owner `DATABASE_URL` in `.env.local` for `db:setup` and `admin:create` only.

**Keep customer data out of the Supabase browser API.** `db:setup` turns on row level security and removes the `anon`/`authenticated` roles' access to these tables, so the publishable key can't read them. Don't add RLS policies or Supabase client queries for these tables in frontend code. Everything goes through the `/api` routes.

## API

All bodies are JSON. Errors are `{ "error": "<message safe to show the user>" }`.

### `POST /api/customer` (public, used by the kiosk form)

Body: `name` (required), `email` (required), `phone` (optional), `interests` (array of one or more product IDs from `lib/products.ts`), `consent` (must be `true`). The server records its own timestamp, so a `submittedAt` field is ignored.

`201 { "ok": true }` · `400` validation message · `413` / `415` malformed request · `500` database unavailable.

After responding, the server texts the customer a confirmation through the Nalo Solutions SMS API, if the `NALO_SMS_*` settings are present (see `.env.example`):

```
Hello Ama Mensah,
Thank you for visiting our stands! Hope you enjoy using our product, we'll contact you soon for your feedback.
Items interested in -
1. Mmofra Leave-In Detangler 250ml
2. Body Butter 500ml

Contact us on 0242334770
~Jayfanks Team
```

This is the default template, built in `lib/sms-format.ts`. Items are the product names and sizes from `lib/products.ts`.

- Only Ghana mobile numbers get a text. Other numbers, landlines and blank phones are skipped.
- Every submission sends a confirmation. There's no per-number or daily limit, so the same number submitting twice gets two texts.
- Admins never receive SMS: a submission whose email matches an admin account isn't texted.
- The name goes into the message only if it's plain words of letters (up to 40 characters). Anything with digits, dots or symbols becomes "Hello there", so nobody can put their own text or links in a message sent under the Jay Fanks name.
- A failed SMS never affects the submission.

### `POST /api/send-sms` (admin only)

Sends one SMS and returns the gateway's response. It needs a signed-in admin session, the same cookie as the admin page.

Body: `{ "phone": "024 000 0000", "message": "...", "customerId"?: "12" }` (no length limit; long messages go out as several SMS parts). With `customerId` and no `phone`, the customer's saved number is used. With `customerId` and no `message`, the default template above is sent for that customer.

`200` sent · `502` gateway refused it · body `{ "logId", "status", "code", "jobId", "msisdn", "httpStatus", "response" }`, where `response` is the gateway's raw reply. Also `400` bad phone, or no message and no `customerId` · `401` not signed in · `403` that customer is an admin · `404` unknown customer · `503` SMS not configured.

### SMS log

Every attempt, automatic or manual, is a row in `sms_messages`. The row holds `status` (`pending`, `sent`, `failed`), the gateway's `provider_code` (`1701` accepted; `1707` invalid sender ID; `1025` out of credit), `job_id`, `http_status`, the full `response` as JSON, and `admin_id` for manual sends. The server log prints one line per attempt with the same details, without the phone number.

`sent` means Nalo accepted the message (`1701`), not that the phone received it. If messages are `sent` but never arrive, check that `NALO_SMS_SENDER_ID` matches an ACTIVE sender ID on the Nalo portal's Sender IDs page exactly, capitals included: Nalo accepted `Jayfanks`, but the approved ID is `JayFanks`, so texts sent as `Jayfanks` were dropped. To check a single message, look up its `job_id` in the portal's reports.

To see recent failures in the Supabase SQL editor:

```sql
select created_at, status, provider_code, http_status, response
from sms_messages where status <> 'sent' order by id desc limit 20;
```

### Admin

The session is an HttpOnly cookie that page JavaScript can't read. Browser `fetch` calls from the same site send it automatically. No password or secret is ever sent to, or stored in, the browser.

| Route | Purpose | Responses |
| --- | --- | --- |
| `POST /api/admin/login` | Body `{ "email", "password" }`. Sets the session cookie (12 hours). | `200 { "admin": { "email" } }` · `400` · `401` wrong email or password · `429` too many attempts (see `Retry-After`) |
| `POST /api/admin/logout` | Ends the session in the database and clears the cookie. | `200 { "ok": true }` |
| `GET /api/admin/session` | Who is signed in. | `200 { "admin": { "email", "expiresAt" } }` · `401` |
| `GET /api/admin/customers?page=1&pageSize=50` | Submissions, newest first (`pageSize` max 200). | `200 { "customers": [{ "id", "name", "email", "phone", "interests": [], "consent", "createdAt", "smsStatus": "sent" \| "failed" \| "pending" \| null }], "page", "pageSize", "total" }` · `401` |

Server components and server actions under `/admin` can call `getAdminSession()` from `lib/auth.ts`. It returns the signed-in admin or `null`.

### Security measures

- Passwords are hashed with scrypt. Only a SHA-256 hash of each session token is stored, so a database leak doesn't expose usable sessions.
- After 5 failed sign-ins for one email, or 20 from one IP, sign-in is blocked for 15 minutes. Every attempt is logged in `admin_login_attempts`.
- Admin POSTs from other sites are rejected (Origin check, JSON-only bodies, `SameSite=Lax` cookie). Admin responses are `Cache-Control: no-store`.
- Server logs never include submitted personal data.
- Every table has row level security on, with no public access through Supabase's REST API. The database connection requires TLS.

Add your privacy notice before publishing. Product names, images, prices, address, email, and phone number are based on [jayfanks.com](https://jayfanks.com); verify them before publishing.
