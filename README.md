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

When deploying (e.g. Vercel), set `DATABASE_URL` in the host's environment variables.

**Keep customer data out of the Supabase browser API.** `db:setup` turns on row level security and removes the `anon`/`authenticated` roles' access to these tables, so the publishable key can't read them. Don't add RLS policies or Supabase client queries for these tables in frontend code. Everything goes through the `/api` routes.

## API

All bodies are JSON. Errors are `{ "error": "<message safe to show the user>" }`.

### `POST /api/customer` (public, used by the kiosk form)

Body: `name` (required), `email` (required), `phone` (optional), `interests` (array of one or more product IDs from `lib/products.ts`), `consent` (must be `true`). The server records its own timestamp, so a `submittedAt` field is ignored.

`201 { "ok": true }` · `400` validation message · `413` / `415` malformed request · `500` database unavailable.

### Admin

The session is an HttpOnly cookie that page JavaScript can't read. Browser `fetch` calls from the same site send it automatically. No password or secret is ever sent to, or stored in, the browser.

| Route | Purpose | Responses |
| --- | --- | --- |
| `POST /api/admin/login` | Body `{ "email", "password" }`. Sets the session cookie (12 hours). | `200 { "admin": { "email" } }` · `400` · `401` wrong email or password · `429` too many attempts (see `Retry-After`) |
| `POST /api/admin/logout` | Ends the session in the database and clears the cookie. | `200 { "ok": true }` |
| `GET /api/admin/session` | Who is signed in. | `200 { "admin": { "email", "expiresAt" } }` · `401` |
| `GET /api/admin/customers?page=1&pageSize=50` | Submissions, newest first (`pageSize` max 200). | `200 { "customers": [{ "id", "name", "email", "phone", "interests": [], "consent", "createdAt" }], "page", "pageSize", "total" }` · `401` |

Server components and server actions under `/admin` can call `getAdminSession()` from `lib/auth.ts`. It returns the signed-in admin or `null`.

### Security measures

- Passwords are hashed with scrypt. Only a SHA-256 hash of each session token is stored, so a database leak doesn't expose usable sessions.
- After 5 failed sign-ins for one email, or 20 from one IP, sign-in is blocked for 15 minutes. Every attempt is logged in `admin_login_attempts`.
- Admin POSTs from other sites are rejected (Origin check, JSON-only bodies, `SameSite=Lax` cookie). Admin responses are `Cache-Control: no-store`.
- Server logs never include submitted personal data.
- Every table has row level security on, with no public access through Supabase's REST API. The database connection requires TLS.

Add your privacy notice before publishing. Product names, images, prices, address, email, and phone number are based on [jayfanks.com](https://jayfanks.com); verify them before publishing.
