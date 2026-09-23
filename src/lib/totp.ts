/**
 * Time-based one-time passwords - RFC 6238, over RFC 4226, keyed in RFC 4648
 * base32.
 *
 * This is the real algorithm, and that is the point. The Settings module could
 * have drawn a QR code and accepted any six digits, and the screen would have
 * looked identical; the difference is that a merchant who mistypes the setup
 * key into their authenticator finds out *here*, at the verification step,
 * instead of at the sign-in that locks them out. A 2FA setup flow whose
 * verification always passes has not tested anything - it has taught the user
 * that the code they hold is correct when nobody checked.
 *
 * Runs on Web Crypto, so it is client-only: `crypto.subtle` is unavailable
 * during the server render and every function here is called from an event
 * handler. `crypto.getRandomValues` is likewise the only acceptable source for
 * a shared secret - `Math.random` is seeded, predictable, and not a secret.
 *
 * What this does *not* do is make the second factor load-bearing. Verifying a
 * code proves the authenticator is set up correctly; it protects sign-in only
 * once an account service stores the secret and checks it at the door. The
 * Security page says so in as many words, because "Enabled" is exactly the kind
 * of claim somebody stops thinking about.
 */

import { TOTP_CONFIG } from "@/constants/settings";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/* -------------------------------------------------------------------------- */
/* Base32                                                                     */
/* -------------------------------------------------------------------------- */

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];

  /* Unpadded. Authenticator apps accept it, and `=` in a setup key that people
     retype by hand is a character nobody knows whether to include. */
  return out;
}

/**
 * Decodes a base32 secret, forgiving the ways people retype one.
 *
 * Spaces, hyphens, lower case and trailing padding are all stripped, because
 * the manual setup key is displayed in groups of four and somebody will paste
 * it back with the groups intact. Returns `null` on a character that is not
 * base32 at all - that is a typo worth reporting, not worth guessing at.
 */
export function base32Decode(secret: string): Uint8Array | null {
  const clean = secret.replace(/[\s-]/g, "").replace(/=+$/, "").toUpperCase();
  if (clean.length === 0) return null;

  const out: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) return null;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Uint8Array.from(out);
}

/* -------------------------------------------------------------------------- */
/* Secrets                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A fresh shared secret.
 *
 * Twenty bytes - 160 bits, the HMAC-SHA1 block size RFC 4226 specifies, which
 * comes out as a 32-character base32 string. Longer is not stronger here and
 * makes the manual key harder to retype; shorter weakens it for no gain.
 */
export function generateTotpSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

/** The setup key in groups of four, for reading off a screen onto a phone. */
export function formatSetupKey(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * The `otpauth://` URI an authenticator app expects, and the QR code's payload.
 *
 * The issuer appears twice - once as a prefix on the label and once as a
 * parameter - which looks redundant and is not: older apps read only the label
 * prefix, newer ones read only the parameter, and omitting either gives some
 * portion of users an entry called "MarketFlow" with no account beside it.
 *
 * Every parameter is spelled out rather than left to the app's defaults, so a
 * client with different defaults cannot produce codes that never verify.
 */
export function buildOtpauthUri(input: {
  secret: string;
  account: string;
  issuer?: string;
}): string {
  const issuer = input.issuer ?? TOTP_CONFIG.issuer;
  const label = encodeURIComponent(`${issuer}:${input.account}`);

  const params = new URLSearchParams({
    secret: input.secret,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_CONFIG.digits),
    period: String(TOTP_CONFIG.periodSeconds),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}

/* -------------------------------------------------------------------------- */
/* Codes                                                                      */
/* -------------------------------------------------------------------------- */

/** The counter for a moment in time: elapsed 30-second steps since the epoch. */
const counterAt = (atMs: number): number =>
  Math.floor(atMs / 1000 / TOTP_CONFIG.periodSeconds);

/** RFC 4226 §5.3: HMAC-SHA1, dynamic truncation, modulo 10^digits. */
async function codeForCounter(
  key: Uint8Array,
  counter: number,
): Promise<string> {
  const message = new ArrayBuffer(8);
  const view = new DataView(message);
  /* Eight-byte big-endian counter. Split because the value can exceed 2^32. */
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const digest = new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, message),
  );

  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];

  return String(binary % 10 ** TOTP_CONFIG.digits).padStart(
    TOTP_CONFIG.digits,
    "0",
  );
}

/** The code an authenticator is showing right now, for the given secret. */
export async function currentTotp(
  secret: string,
  atMs: number = Date.now(),
): Promise<string | null> {
  const key = base32Decode(secret);
  if (!key) return null;
  return codeForCounter(key, counterAt(atMs));
}

/**
 * Whether `code` is valid for `secret` at this moment.
 *
 * Checks one step either side of now. That is thirty seconds of clock drift in
 * each direction, which covers a phone whose time has not synced recently
 * without widening the window a shoulder-surfed code stays usable in.
 *
 * Comparison is on the whole string after normalising, rather than short-circuiting
 * digit by digit - the difference is not meaningful against a six-digit code over
 * a network, but the habit is the right one to keep in verification code.
 */
export async function verifyTotp(
  secret: string,
  code: string,
  atMs: number = Date.now(),
): Promise<boolean> {
  const key = base32Decode(secret);
  if (!key) return false;

  const entered = code.replace(/\D/g, "");
  if (entered.length !== TOTP_CONFIG.digits) return false;

  const counter = counterAt(atMs);

  for (let drift = -TOTP_CONFIG.window; drift <= TOTP_CONFIG.window; drift += 1) {
    const expected = await codeForCounter(key, counter + drift);
    if (constantTimeEquals(expected, entered)) return true;
  }

  return false;
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Seconds until the current code rolls over. Drives the countdown in setup. */
export function secondsRemaining(atMs: number = Date.now()): number {
  return (
    TOTP_CONFIG.periodSeconds -
    Math.floor((atMs / 1000) % TOTP_CONFIG.periodSeconds)
  );
}

/* -------------------------------------------------------------------------- */
/* Recovery codes                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Single-use codes for when the authenticator is on a phone in a river.
 *
 * Crockford's alphabet minus the ambiguous characters, because these get
 * written on paper and read back later: no O against 0, no I or L against 1.
 * Ten of them, grouped `XXXX-XXXX`, from `getRandomValues` for the same reason
 * the shared secret is.
 */
export function generateRecoveryCodes(
  count: number = TOTP_CONFIG.recoveryCodeCount,
): string[] {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(count * 8);
  crypto.getRandomValues(bytes);

  return Array.from({ length: count }, (_, index) => {
    const chars = Array.from(bytes.subarray(index * 8, index * 8 + 8), (byte) =>
      alphabet[byte % alphabet.length],
    ).join("");

    return `${chars.slice(0, 4)}-${chars.slice(4)}`;
  });
}
