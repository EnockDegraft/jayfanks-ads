// Creates an admin, or resets their password (which also signs out their sessions).
// Usage: npm run admin:create -- owner@example.com
// The password is typed at a hidden prompt, never passed on the command line.
import postgres from "postgres";
import { connectionOptions } from "../lib/pg-options.ts";
import { hashPassword } from "../lib/password.ts";

const MIN_PASSWORD_LENGTH = 12;

function exit(message) {
  console.error(message);
  process.exit(1);
}

/** Reads one line without echoing it. Falls back to plain stdin when piped. */
function readSecret(prompt) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      let data = "";
      stdin.setEncoding("utf8");
      stdin.on("data", (chunk) => (data += chunk));
      stdin.on("end", () => resolve(data.split(/\r?\n/)[0] ?? ""));
      return;
    }
    process.stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();
    let input = "";
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(input);
          return;
        }
        if (char === "\u0003") {
          process.stdout.write("\n");
          process.exit(130);
        }
        if (char === "\u007f" || char === "\b") input = input.slice(0, -1);
        else input += char;
      }
    };
    stdin.on("data", onData);
  });
}

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  exit("Usage: npm run admin:create -- <email>");
}
if (!process.env.DATABASE_URL) {
  exit("DATABASE_URL is not set. Add it to .env.local first (see .env.example).");
}

const password = await readSecret(`Password for ${email} (at least ${MIN_PASSWORD_LENGTH} characters): `);
if (password.length < MIN_PASSWORD_LENGTH) exit(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
if (process.stdin.isTTY && (await readSecret("Repeat password: ")) !== password) {
  exit("Passwords didn't match.");
}

const url = process.env.DATABASE_URL;
const sql = postgres(url, {
  ...connectionOptions(url),
  max: 1,
  prepare: false,
  onnotice: () => {},
  connect_timeout: 15
});
try {
  const passwordHash = await hashPassword(password);
  const [existing] = await sql`select id from admin_users where email = ${email}`;
  if (existing) {
    await sql.begin(async (tx) => {
      await tx`update admin_users set password_hash = ${passwordHash} where id = ${existing.id}`;
      await tx`delete from admin_sessions where admin_id = ${existing.id}`;
    });
    console.log(`Password updated for ${email}. Their existing sessions were signed out.`);
  } else {
    await sql`insert into admin_users (email, password_hash) values (${email}, ${passwordHash})`;
    console.log(`Admin created: ${email}`);
  }
} catch (error) {
  console.error("Couldn't save the admin:", error instanceof Error ? error.message : error);
  if (error?.code === "42P01") console.error("Run `npm run db:setup` first.");
  process.exitCode = 1;
} finally {
  await sql.end();
}
