// Gives the deployed app its own least-privilege database login (role kiosk_app) with a new
// random password, checks it works, and writes its DATABASE_URL to .env.production.local.
// Re-run to rotate the password. Run with: npm run db:app-credentials
// Uses the owner DATABASE_URL from .env / .env.local; run `npm run db:setup` first.
import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import postgres from "postgres";
import { connectionOptions } from "../lib/pg-options.ts";

const ROLE = "kiosk_app";
const OUT_FILE = ".env.production.local";

function exit(message) {
  console.error(message);
  process.exit(1);
}

/** Postgres SCRAM-SHA-256 verifier, so the plain password never reaches the server or its logs. */
function scramVerifier(password) {
  const iterations = 4096;
  const salt = randomBytes(16);
  const salted = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const clientKey = createHmac("sha256", salted).update("Client Key").digest();
  const storedKey = createHash("sha256").update(clientKey).digest();
  const serverKey = createHmac("sha256", salted).update("Server Key").digest();
  return `SCRAM-SHA-256$${iterations}:${salt.toString("base64")}$${storedKey.toString("base64")}:${serverKey.toString("base64")}`;
}

/** Same server as the owner URL, logged in as the app role. Supabase's pooler wants "<role>.<project-ref>". */
function appUrl(ownerUrl, password) {
  const url = new URL(ownerUrl);
  const projectRef = url.hostname.endsWith(".pooler.supabase.com") ? url.username.split(".")[1] : null;
  url.username = projectRef ? `${ROLE}.${projectRef}` : ROLE;
  url.password = password;
  return url.toString();
}

function connect(url) {
  return postgres(url, { ...connectionOptions(url), max: 1, prepare: false, onnotice: () => {}, connect_timeout: 15 });
}

async function writeEnvFile(databaseUrl) {
  let existing = "";
  try {
    existing = await readFile(OUT_FILE, "utf8");
  } catch {}
  const kept = existing.split("\n").filter((line) => line.trim() && !/^\s*DATABASE_URL\s*=/.test(line));
  const header = kept.length ? [] : ["# Production database login for the app (role kiosk_app). Never commit this file."];
  await writeFile(OUT_FILE, [...header, ...kept, `DATABASE_URL=${databaseUrl}`, ""].join("\n"), { mode: 0o600 });
  await chmod(OUT_FILE, 0o600);
}

const ownerUrl = process.env.DATABASE_URL;
if (!ownerUrl) exit("DATABASE_URL is not set. Add the owner connection string to .env.local first.");

const owner = connect(ownerUrl);
const password = randomBytes(32).toString("base64url");
const verifier = scramVerifier(password);
if (!/^[A-Za-z0-9+/=:$-]+$/.test(verifier)) exit("Unexpected characters in password verifier.");

try {
  const [role] = await owner`select 1 from pg_roles where rolname = ${ROLE}`;
  if (!role) exit("The kiosk_app role doesn't exist yet. Run `npm run db:setup` first.");
  await owner.unsafe(`alter role ${ROLE} login password '${verifier}'`);
} finally {
  await owner.end();
}

// Check the new login: it must reach the app's tables and nothing more.
const databaseUrl = appUrl(ownerUrl, password);
let app;
let lastError;
for (let attempt = 1; attempt <= 5; attempt++) {
  app = connect(databaseUrl);
  try {
    await app`select count(*) from customers`;
    lastError = undefined;
    break;
  } catch (error) {
    lastError = error;
    await app.end({ timeout: 1 }).catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 3000)); // poolers can take a moment to see a new password
  }
}
if (lastError) exit(`The new login couldn't connect: ${lastError.message}`);

// Each probe runs in a transaction that is always rolled back, so nothing it does can stick.
const ROLLBACK = new Error("rollback");
const denied = async (probe) => {
  try {
    await app.begin(async (tx) => {
      await probe(tx);
      throw ROLLBACK;
    });
    return false;
  } catch (error) {
    return error !== ROLLBACK && error.code === "42501";
  }
};
try {
  const checks = {
    "read customers": !(await denied((tx) => tx`select id from customers limit 1`)),
    "cannot change customers": await denied((tx) => tx`update customers set name = name where false`),
    "cannot delete customers": await denied((tx) => tx`delete from customers where false`),
    "cannot change admin accounts": await denied((tx) => tx`update admin_users set email = email where false`),
    "cannot create tables": await denied((tx) => tx`create table kiosk_app_probe (id int)`)
  };
  for (const [check, ok] of Object.entries(checks)) console.log(`  ${ok ? "✓" : "✗"} ${check}`);
  if (!Object.values(checks).every(Boolean)) exit("The app login has unexpected permissions. Nothing was written.");
} finally {
  await app.end();
}

await writeEnvFile(databaseUrl);
console.log(`New ${ROLE} password set. Its DATABASE_URL is in ${OUT_FILE} (password not shown).`);
