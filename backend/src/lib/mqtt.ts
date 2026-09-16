import { prisma } from "../lib/prisma.js";
import { readingService } from "../services/reading.service.js";
import type { MqttClient } from "mqtt";

export function setupMqtt(
  mqttClient: MqttClient,
  config: { dataTopic: string; heartbeatTopic: string }
) {
  mqttClient.on("connect", () => {
    console.log(`✅ MQTT connected to ${mqttClient.options.hostname ?? "broker"}`);
    mqttClient.subscribe(config.dataTopic, { qos: 1 });
    mqttClient.subscribe(config.heartbeatTopic, { qos: 1 });
    console.log(`📡 Subscribed to: ${config.dataTopic}`);
    console.log(`💓 Subscribed to: ${config.heartbeatTopic}`);
  });

  mqttClient.on("message", async (topic: string, message: Buffer) => {
    if (topic.endsWith("/data")) {
      await onData(topic, message);
    } else if (topic.endsWith("/heartbeat")) {
      await onHeartbeat(topic);
    }
  });

  mqttClient.on("error", (err) => {
    console.error("❌ MQTT error:", err.message);
  });

  mqttClient.on("offline", () => {
    console.warn("⚠️  MQTT client went offline");
  });
}

async function onData(topic: string, message: Buffer) {
  const sensorCode = extractSensorCode(topic);
  if (!sensorCode) return;

  try {
    const payload = JSON.parse(message.toString());
    const temperature = Number(payload.temperature);
    const humidity = Number(payload.humidity);

    if (!Number.isFinite(temperature) || !Number.isFinite(humidity)) {
      console.warn(`⚠️  Invalid payload on ${topic}:`, payload);
      return;
    }
    if (temperature < -40 || temperature > 125 || humidity < 0 || humidity > 100) {
      console.warn(`⚠️  Out-of-range payload on ${topic}:`, payload);
      return;
    }
    await readingService.ingestFromSensor(sensorCode, temperature, humidity);
  } catch (err) {
    console.error(`❌ Failed to process message on ${topic}:`, err);
  }
}

async function onHeartbeat(topic: string) {
  const sensorCode = extractSensorCode(topic);
  if (!sensorCode) return;
  const sensor = await prisma.sensor.findUnique({ where: { sensorCode } });
  if (!sensor) return;
  readingService.touch(sensor.id);
}

export function extractSensorCode(topic: string): string | null {
  const parts = topic.split("/");
  return parts.length >= 3 ? (parts[1] ?? null) : null;
}