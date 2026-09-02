// lib/security/hmacToken.ts
// ─────────────────────────────────────────────────────────────────────
// Anti-Proxy Layer 1: HMAC-Signed Rotating Token Engine
// ─────────────────────────────────────────────────────────────────────
import crypto from "crypto";

export interface SignedQRPayload {
  sessionId: string;
  seq: number;
  iat: number; // issued at (unix sec)
  exp: number; // expires at (unix sec)
  nonce: string;
  signature: string;
}

/**
 * Generates an HMAC-SHA256 signed rotating token payload for a session
 */
export function generateSignedToken(
  sessionId: string,
  tokenSecret: string,
  seq: number,
  validSeconds = 12,
  nonce = crypto.randomBytes(6).toString("hex")
): SignedQRPayload {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + validSeconds;
  const message = `${sessionId}.${seq}.${iat}.${exp}.${nonce}`;
  const signature = crypto
    .createHmac("sha256", tokenSecret)
    .update(message)
    .digest("hex")
    .slice(0, 16); // compact 16-char signature

  return {
    sessionId,
    seq,
    iat,
    exp,
    nonce,
    signature,
  };
}

/**
 * Verifies an incoming HMAC token against the session secret and time window
 */
export function verifySignedToken(
  payload: SignedQRPayload,
  tokenSecret: string
): { valid: boolean; reason?: "token_invalid" | "token_expired" | "stale_token" } {
  const nowSec = Math.floor(Date.now() / 1000);

  // 1. Check time window (with 2s clock skew grace)
  if (nowSec < payload.iat - 2 || nowSec > payload.exp + 2) {
    return { valid: false, reason: "token_expired" };
  }

  // 2. Re-compute HMAC signature
  const message = `${payload.sessionId}.${payload.seq}.${payload.iat}.${payload.exp}.${payload.nonce}`;
  const expectedSignature = crypto
    .createHmac("sha256", tokenSecret)
    .update(message)
    .digest("hex")
    .slice(0, 16);

  if (payload.signature !== expectedSignature) {
    return { valid: false, reason: "token_invalid" };
  }

  return { valid: true };
}
