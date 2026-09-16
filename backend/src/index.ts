import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { existsSync } from "node:fs";
import { config } from "./config/index.js";
import { authPlugin } from "./plugins/auth.plugin.js";
import { authRoutes } from "./routes/auth.js";
import { sensorRoutes } from "./routes/sensors.js";
import { readingRoutes } from "./routes/readings.js";
import { alertRoutes } from "./routes/alerts.js";
import { settingsRoutes } from "./routes/settings.js";
import { websocketRoute } from "./routes/websocket.js";
import { setupMqtt } from "./lib/mqtt.js";
import { readingService } from "./services/reading.service.js";
import { startSimulator } from "./lib/simulator.js";

import mqtt from "mqtt";

const app = Fastify({
  logger: { transport: undefined },
});

app.register(cors, { origin: config.corsOrigin.split(","), credentials: true });

await app.register(websocket);

await app.register(authPlugin);

await app.register(websocketRoute);

app.register(authRoutes);
app.register(sensorRoutes);
app.register(readingRoutes);
app.register(alertRoutes);
app.register(settingsRoutes);

app.get("/health", async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  wsClients: 0,
}));

const mqttClient = mqtt.connect(config.mqtt.url, {
  clientId: `stm-backend-${Date.now()}`,
  reconnectPeriod: 3000,
  connectTimeout: 10000,
  username: config.mqtt.username,
  password: config.mqtt.password,
});

setupMqtt(mqttClient, {
  dataTopic: config.mqtt.dataTopic,
  heartbeatTopic: config.mqtt.heartbeatTopic,
});

readingService.startOfflineMonitor();

if (process.env.SIMULATE_SENSOR === "true") {
  startSimulator(mqttClient, {
    sensorCode: process.env.SIM_SENSOR_CODE ?? "ST-001",
    intervalMs: Number(process.env.SIM_INTERVAL_MS ?? 5000),
    tempBase: Number(process.env.SIM_TEMP_BASE ?? 28.5),
    humidityBase: Number(process.env.SIM_HUMIDITY_BASE ?? 65),
  });
}

const backendDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const frontendDist = path.resolve(backendDir, "..", "frontend", "dist");
if (existsSync(path.join(frontendDist, "index.html"))) {
  app.register(fastifyStatic, {
    root: frontendDist,
    prefix: "/",
    wildcard: false,
  });
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith("/api") || req.url.startsWith("/ws")) {
      return reply.code(404).send({ error: "Not Found" });
    }
    return reply.sendFile("index.html");
  });
  console.log(`🌐 Frontend di-serve dari: ${frontendDist}`);
} else {
  console.warn("⚠️  frontend/dist belum ada — jalankan build frontend dulu (frontend/dist/index.html tidak ditemukan). API tetap jalan.");
}

try {
  await app.listen({ port: config.port, host: config.host });
  console.log(`🚀 Server berjalan di http://${config.host}:${config.port}`);
  console.log(`📡 MQTT broker: ${config.mqtt.url}`);
  console.log(`🔌 WebSocket: ws://${config.host}:${config.port}/ws`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}