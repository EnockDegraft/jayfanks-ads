-- One row per kiosk form submission. Safe to run more than once.
create table if not exists customers (
  id          bigint generated always as identity primary key,
  name        text        not null,
  email       text        not null,
  phone       text,
  interests   text[]      not null default '{}',  -- product IDs from lib/products.ts
  consent     boolean     not null check (consent),
  created_at  timestamptz not null default now()
);

create index if not exists customers_created_at_idx on customers (created_at desc);
create index if not exists customers_email_idx on customers (email);

-- Staff who can sign in to the admin page. Create them with: npm run admin:create -- <email>
create table if not exists admin_users (
  id             bigint generated always as identity primary key,
  email          text        not null unique,
  password_hash  text        not null,
  created_at     timestamptz not null default now()
);

-- Signed-in sessions. Only a SHA-256 hash of the cookie token is stored.
create table if not exists admin_sessions (
  token_hash  text        primary key,
  admin_id    bigint      not null references admin_users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);

create index if not exists admin_sessions_admin_id_idx on admin_sessions (admin_id);

-- Every sign-in attempt, used to slow down password guessing and as an audit trail.
create table if not exists admin_login_attempts (
  id          bigint generated always as identity primary key,
  email       text        not null,
  ip          text,
  succeeded   boolean     not null,
  created_at  timestamptz not null default now()
);

create index if not exists admin_login_attempts_email_idx on admin_login_attempts (email, created_at);
create index if not exists admin_login_attempts_ip_idx on admin_login_attempts (ip, created_at);

-- Every SMS the app tried to send, as a log and to show delivery status on the admin page.
create table if not exists sms_messages (
  id             bigint generated always as identity primary key,
  customer_id    bigint      not null references customers (id) on delete cascade,
  msisdn         text        not null,  -- normalised Ghana number, e.g. 233240371188
  status         text        not null,  -- pending (claimed, sending), sent, failed
  provider_code  text,                  -- gateway code: 1701 = accepted; 1707, 1025, ... = errors
  job_id         text,                  -- gateway message ID, for matching delivery reports
  created_at     timestamptz not null default now()
);

-- Named so it can be replaced if the allowed statuses change.
alter table sms_messages drop constraint if exists sms_messages_status_check;
alter table sms_messages add constraint sms_messages_status_check
  check (status in ('pending', 'sent', 'failed'));

-- Manual sends from POST /api/send-sms: may have no customer, and record which admin sent them.
-- http_status and response keep the gateway's reply for each attempt.
alter table sms_messages alter column customer_id drop not null;
alter table sms_messages add column if not exists admin_id bigint references admin_users (id) on delete set null;
alter table sms_messages add column if not exists http_status integer;
alter table sms_messages add column if not exists response jsonb;

create index if not exists sms_messages_msisdn_idx on sms_messages (msisdn, created_at);
create index if not exists sms_messages_created_at_idx on sms_messages (created_at);
create index if not exists sms_messages_customer_id_idx on sms_messages (customer_id);

-- Keep every table server-only. Supabase serves the public schema through its REST API to
-- anyone holding the publishable (anon) key; row level security with no policies blocks that.
-- The server connects as the table owner, which RLS doesn't restrict.
alter table customers enable row level security;
alter table admin_users enable row level security;
alter table admin_sessions enable row level security;
alter table admin_login_attempts enable row level security;
alter table sms_messages enable row level security;

-- Belt and braces on Supabase: remove the API roles' table privileges as well.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on customers, admin_users, admin_sessions, admin_login_attempts, sms_messages
      from anon, authenticated;
  end if;
end
$$;

-- Least-privilege login for the deployed app. Its password is set by
-- `npm run db:app-credentials`; this file never contains one.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'kiosk_app') then
    create role kiosk_app nologin;
  end if;
end
$$;

alter role kiosk_app set statement_timeout = '10s';
revoke create on schema public from public;  -- already the default on Postgres 15+ (Supabase)
grant usage on schema public to kiosk_app;
grant select, insert on customers to kiosk_app;                    -- save and list submissions
grant select on admin_users to kiosk_app;                          -- check passwords (changes run locally)
grant select, insert, delete on admin_sessions to kiosk_app;
grant select, insert, delete on admin_login_attempts to kiosk_app;
grant select, insert on sms_messages to kiosk_app;                 -- log sends, show status on the admin page
grant update (status, provider_code, job_id, http_status, response) on sms_messages to kiosk_app;  -- outcome only

-- The app isn't the table owner, so row level security applies to it: allow it, and only it.
drop policy if exists kiosk_app_access on customers;
create policy kiosk_app_access on customers for all to kiosk_app using (true) with check (true);
drop policy if exists kiosk_app_access on admin_users;
create policy kiosk_app_access on admin_users for all to kiosk_app using (true) with check (true);
drop policy if exists kiosk_app_access on admin_sessions;
create policy kiosk_app_access on admin_sessions for all to kiosk_app using (true) with check (true);
drop policy if exists kiosk_app_access on admin_login_attempts;
create policy kiosk_app_access on admin_login_attempts for all to kiosk_app using (true) with check (true);
drop policy if exists kiosk_app_access on sms_messages;
create policy kiosk_app_access on sms_messages for all to kiosk_app using (true) with check (true);
