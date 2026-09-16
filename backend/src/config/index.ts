import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { existsSync } from "node:fs";

const backendDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const candidates = [
  path.join(backendDir, ".env"),
  path.resolve(backendDir, "..", ".env"),
  path.join(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", ".env"),
];

for (const file of candidates) {
  if (existsSync(file)) {
    loadEnv({ path: file });
  }
}

export const config = {
  port: Number(process.env.PORT ?? 8080),
  host: process.env.HOST ?? "0.0.0.0",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  jwt: {
    secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  },
  mqtt: {
    url: process.env.MQTT_URL ?? "mqtt://localhost:1883",
    dataTopic: process.env.MQTT_DATA_TOPIC ?? "sensors/+/data",
    heartbeatTopic: process.env.MQTT_HEARTBEAT_TOPIC ?? "sensors/+/heartbeat",
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
  },
  sensorOfflineTimeout: Number(process.env.SENSOR_OFFLINE_TIMEOUT ?? 30000),
};