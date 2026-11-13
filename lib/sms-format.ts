// Pure helpers for the confirmation SMS (no imports, so they can be tested with plain Node).

/**
 * Ghana mobile numbers only, in the international form the gateway expects:
 * "024 037 1188", "+233 24 037 1188" and "00233240371188" all become "233240371188".
 */
export function toGhanaMobile(phone: string): string | null {
  let digits = phone.replace(/[\s().-]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^0\d{9}$/.test(digits)) digits = `233${digits.slice(1)}`;
  return /^233[25]\d{8}$/.test(digits) ? digits : null;
}

/**
 * The default confirmation sent after every kiosk submission. The text is fixed apart from the
 * name and the product names. The name is only used if it's plain words of letters (no digits,
 * dots or links), so nobody can use the public form to send their own text under the Jay Fanks
 * name; anything else becomes "Hello there". Items come from the product list, never the form.
 */
export function confirmationMessage(name: string, items: string[]): string {
  const cleaned = name.trim().replace(/\s+/g, " ");
  const safeName = /^\p{L}[\p{L}'-]*( \p{L}[\p{L}'-]*)*$/u.test(cleaned) && cleaned.length <= 40 ? cleaned : "there";
  const list = items.length > 0 ? ["Items interested in -", ...items.map((item, i) => `${i + 1}. ${item}`)] : [];
  return [
    `Hello ${safeName},`,
    "Thank you for visiting our stands! Hope you enjoy using our product, we'll contact you soon for your feedback.",
    ...list,
    "",
    "Contact us on 0242334770",
    "~Jayfanks Team"
  ].join("\n");
}
