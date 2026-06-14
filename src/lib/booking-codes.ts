import { randomBytes, randomInt } from "crypto";

// Crockford-ish: no 0/O/1/I/L to keep references readable over the phone.
export const REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Short human-friendly booking reference (8 chars) for emails / phone quoting. */
export function generateReference(): string {
  let out = "";
  for (let i = 0; i < 8; i++) out += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return out;
}

/** Long, unguessable token that drives the public status URL. */
export function generatePublicToken(): string {
  return randomBytes(24).toString("base64url");
}
