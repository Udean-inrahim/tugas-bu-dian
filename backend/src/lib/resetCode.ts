import { createHmac } from "node:crypto";

const TTL_MS = 15 * 60 * 1000;

function secret() {
  return process.env.RESET_CODE_SECRET ?? process.env.JWT_SECRET ?? "dev-secret-change-me";
}

function bucketAt(now: number) {
  return Math.floor(now / TTL_MS);
}

function codeFor(email: string, bucket: number) {
  const digest = createHmac("sha256", secret())
    .update(`${email.trim().toLowerCase()}:${bucket}`)
    .digest("hex");
  const num = parseInt(digest.slice(0, 8), 16) % 1_000_000;
  return String(num).padStart(6, "0");
}

export function createResetCode(email: string, now = Date.now()) {
  const bucket = bucketAt(now);
  return {
    code: codeFor(email, bucket),
    expiresAt: new Date((bucket + 1) * TTL_MS).toISOString(),
  };
}

export function verifyResetCode(email: string, code: string, now = Date.now()) {
  const bucket = bucketAt(now);
  const normalized = code.trim();
  return normalized === codeFor(email, bucket) || normalized === codeFor(email, bucket - 1);
}
