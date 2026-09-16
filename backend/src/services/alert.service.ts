import { prisma } from "../lib/prisma.js";
import { wsHub } from "../lib/wsHub.js";
import { buildThresholdViolations } from "../lib/threshold.js";
import { getActiveSettings } from "./settings.service.js";

export async function evaluateThresholds(
  sensorId: number,
  temperature: number,
  humidity: number
) {
  const settings = await getActiveSettings();
  const violations = buildThresholdViolations(sensorId, temperature, humidity, settings);

  for (const v of violations) {
    const existing = await prisma.alert.findFirst({
      where: {
        sensorId,
        type: v.type,
        status: "ACTIVE",
      },
    });

    if (!existing) {
      const alert = await prisma.alert.create({
        data: {
          sensorId,
          type: v.type,
          value: v.value,
          threshold: v.threshold,
          message: v.message,
          severity: v.severity,
        },
      });
      wsHub.broadcast("alert", alert);

      const sensor = await prisma.sensor.findUnique({ where: { id: sensorId } });
      console.log(
        `🚨 Alert: [${v.severity}] ${v.type} — ${sensor?.name ?? sensorId}: ${v.message}`
      );
    }
  }

  // Auto-resolve threshold alerts whose condition is back to normal
  const activeTypes = violations.map((v) => v.type);
  const activeAlerts = await prisma.alert.findMany({
    where: { sensorId, status: "ACTIVE", type: { in: ["HIGH_TEMP", "LOW_TEMP", "HIGH_HUMIDITY", "LOW_HUMIDITY"] } },
  });

  const toResolve = activeAlerts.filter(
    (a) => !activeTypes.includes(a.type as (typeof activeTypes)[number])
  );

  if (toResolve.length > 0) {
    await prisma.alert.updateMany({
      where: { id: { in: toResolve.map((a) => a.id) } },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
    for (const alert of toResolve) {
      wsHub.broadcast("alert_resolved", {
        id: alert.id,
        sensorId,
        status: "RESOLVED",
      });
    }
  }
}

export async function resolveAlertsForSensor(sensorId: number) {
  const activeAlerts = await prisma.alert.findMany({
    where: { sensorId, status: "ACTIVE" },
  });

  if (activeAlerts.length === 0) return;

  await prisma.alert.updateMany({
    where: { sensorId, status: "ACTIVE" },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });

  for (const alert of activeAlerts) {
    wsHub.broadcast("alert_resolved", {
      id: alert.id,
      sensorId,
      status: "RESOLVED",
    });
  }
}

export async function resolveAlert(id: number) {
  const updated = await prisma.alert.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
  wsHub.broadcast("alert_resolved", { id, sensorId: updated.sensorId, status: "RESOLVED" });
  return updated;
}

export async function createOfflineAlert(sensorId: number) {
  const existing = await prisma.alert.findFirst({
    where: { sensorId, type: "SENSOR_OFFLINE", status: "ACTIVE" },
  });
  if (existing) return null;

  const sensor = await prisma.sensor.findUnique({ where: { id: sensorId } });
  const alert = await prisma.alert.create({
    data: {
      sensorId,
      type: "SENSOR_OFFLINE",
      value: 0,
      threshold: 0,
      message: `Sensor ${sensor?.name ?? sensor?.sensorCode ?? sensorId} tidak terhubung`,
      severity: "CRITICAL",
    },
  });
  wsHub.broadcast("alert", alert);
  console.log(`🔴 SENSOR OFFLINE — ${sensor?.name ?? sensorId}`);
  return alert;
}

export async function resolveOfflineAlert(sensorId: number, sensorCode: string) {
  const updated = await prisma.alert.updateMany({
    where: { sensorId, type: "SENSOR_OFFLINE", status: "ACTIVE" },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
  if (updated.count > 0) {
    wsHub.broadcast("alert_resolved", { sensorId, status: "RESOLVED" });
  }
}