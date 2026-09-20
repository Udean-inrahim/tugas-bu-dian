import { createHash, randomBytes } from "node:crypto";

// API key rahasia per sensor: key mentah disimpan hanya saat dibuat/di-regenerate,
// yang tersimpan di database hanyalah hash SHA-256-nya.
export function generateApiKey() {
  return randomBytes(16).toString("hex");
}

export function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

// Dilempar saat device mengirim data dengan API key yang tidak cocok.
export class SensorApiKeyError extends Error {
  constructor() {
    super("API key sensor salah");
    this.name = "SensorApiKeyError";
  }
}

type SensorWithKey = { apiKeyHash: string | null } & Record<string, unknown>;

// Bentuk sensor yang aman dikirim ke frontend: hash API key disembunyikan,
// cukup tanda boolean hasApiKey.
export function publicSensor(sensor: SensorWithKey) {
  const { apiKeyHash, ...rest } = sensor;
  return { ...rest, hasApiKey: Boolean(apiKeyHash) };
}