import { createHmac } from "node:crypto";

const TTL_MS = 15 * 60 * 1000;

function secret() {
  return process.env.RESET_CODE_SECRET ?? process.env.JWT_SECRET ?? "dev-secret-change-me";
}

function bucketAt(now: number) {
  return Math.floor(now / TTL_MS);
}

function codeFor(purpose: string, email: string, bucket: number) {
  const digest = createHmac("sha256", secret())
    .update(`${purpose}:${email.trim().toLowerCase()}:${bucket}`)
    .digest("hex");
  const num = parseInt(digest.slice(0, 8), 16) % 1_000_000;
  return String(num).padStart(6, "0");
}

function makeCode(purpose: string, email: string, now: number) {
  const bucket = bucketAt(now);
  return {
    code: codeFor(purpose, email, bucket),
    expiresAt: new Date((bucket + 1) * TTL_MS).toISOString(),
  };
}

function checkCode(purpose: string, email: string, code: string, now: number) {
  const bucket = bucketAt(now);
  const normalized = code.trim();
  return (
    normalized === codeFor(purpose, email, bucket) ||
    normalized === codeFor(purpose, email, bucket - 1)
  );
}

export function createResetCode(email: string, now = Date.now()) {
  return makeCode("reset", email, now);
}

export function verifyResetCode(email: string, code: string, now = Date.now()) {
  return checkCode("reset", email, code, now);
}

export function createVerifyCode(email: string, now = Date.now()) {
  return makeCode("verify", email, now);
}

export function verifyVerifyCode(email: string, code: string, now = Date.now()) {
  return checkCode("verify", email, code, now);
}
