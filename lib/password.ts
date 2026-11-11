// Password hashing with scrypt (built into Node, no extra dependency).
// Stored format: scrypt$<log2 N>$<r>$<p>$<salt base64>$<hash base64>
// Uses only erasable TypeScript so scripts/create-admin.mjs can import it directly.
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";

const LOG2_N = 17; // N = 131072, r = 8, p = 1: OWASP's recommended minimum for scrypt
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function scrypt(password: string, salt: Buffer, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

function options(log2N: number, r: number, p: number): ScryptOptions {
  const N = 2 ** log2N;
  // scrypt needs about 128 * N * r bytes; Node's default memory cap is too low for N = 2^17.
  return { N, r, p, maxmem: 256 * N * r };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scrypt(password, salt, KEY_LENGTH, options(LOG2_N, R, P));
  return ["scrypt", LOG2_N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, log2N, r, p, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;

  const expected = Buffer.from(keyB64, "base64");
  const actual = await scrypt(
    password,
    Buffer.from(saltB64, "base64"),
    expected.length,
    options(Number(log2N), Number(r), Number(p))
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
