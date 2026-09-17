import { prisma } from "./prisma.js";
import { buildThresholdViolations } from "../lib/threshold.js";
import { getActiveSettings } from "./settings.js";

export async function evaluateThresholds(
  sensorId: number,
  temperature: number,
  humidity: number
) {
  const settings = await getActiveSettings();
  const violations = buildThresholdViolations(sensorId, temperature, humidity, settings);

  for (const v of violations) {
    const existing = await prisma.alert.findFirst({
      where: { sensorId, type: v.type, status: "ACTIVE" },
    });
    if (!existing) {
      await prisma.alert.create({
        data: {
          sensorId,
          type: v.type,
          value: v.value,
          threshold: v.threshold,
          message: v.message,
          severity: v.severity,
        },
      });
    }
  }

  const activeTypes = violations.map((v) => v.type);
  const activeAlerts = await prisma.alert.findMany({
    where: {
      sensorId,
      status: "ACTIVE",
      type: { in: ["HIGH_TEMP", "LOW_TEMP", "HIGH_HUMIDITY", "LOW_HUMIDITY"] },
    },
  });
  const toResolve = activeAlerts.filter(
    (a) => !(activeTypes as readonly string[]).includes(a.type)
  );
  if (toResolve.length > 0) {
    await prisma.alert.updateMany({
      where: { id: { in: toResolve.map((a) => a.id) } },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
  }
}

export async function resolveAlert(id: number) {
  return prisma.alert.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
}

export async function resolveOfflineAlerts(sensorId: number) {
  return prisma.alert.updateMany({
    where: { sensorId, type: "SENSOR_OFFLINE", status: "ACTIVE" },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
}

export async function createOfflineAlert(sensorId: number) {
  const existing = await prisma.alert.findFirst({
    where: { sensorId, type: "SENSOR_OFFLINE", status: "ACTIVE" },
  });
  if (existing) return null;

  const sensor = await prisma.sensor.findUnique({ where: { id: sensorId } });
  return prisma.alert.create({
    data: {
      sensorId,
      type: "SENSOR_OFFLINE",
      value: 0,
      threshold: 0,
      message: `Sensor ${sensor?.name ?? sensor?.sensorCode ?? sensorId} tidak terhubung`,
      severity: "CRITICAL",
    },
  });
}