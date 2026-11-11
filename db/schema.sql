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

-- Keep every table server-only. Supabase serves the public schema through its REST API to
-- anyone holding the publishable (anon) key; row level security with no policies blocks that.
-- The server connects as the table owner, which RLS doesn't restrict.
alter table customers enable row level security;
alter table admin_users enable row level security;
alter table admin_sessions enable row level security;
alter table admin_login_attempts enable row level security;

-- Belt and braces on Supabase: remove the API roles' table privileges as well.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on customers, admin_users, admin_sessions, admin_login_attempts from anon, authenticated;
  end if;
end
$$;
