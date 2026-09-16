import { prisma } from "../lib/prisma.js";
import { wsHub } from "../lib/wsHub.js";
import { evaluateThresholds, resolveOfflineAlert, createOfflineAlert } from "./alert.service.js";
import { config } from "../config/index.js";

// In-memory map of last contact time per sensor id.
export const lastContact = new Map<number, number>();

export class ReadingService {
  touch(sensorId: number) {
    lastContact.set(sensorId, Date.now());
  }

  async ingestFromSensor(sensorCode: string, temperature: number, humidity: number) {
    const sensor = await prisma.sensor.findUnique({ where: { sensorCode } });
    if (!sensor) {
      console.warn(`⚠️  Unknown sensor code: ${sensorCode} — ignoring reading`);
      return null;
    }
    return this.recordReading(sensor.id, temperature, humidity);
  }

  async recordReading(sensorId: number, temperature: number, humidity: number) {
    const reading = await prisma.sensorReading.create({
      data: { sensorId, temperature, humidity },
    });

    // Mark sensor online
    const wasOffline = (await prisma.sensor.findUnique({ where: { id: sensorId } }))?.status === "OFFLINE";
    await prisma.sensor.update({
      where: { id: sensorId },
      data: { status: "ONLINE" },
    });

    lastContact.set(sensorId, Date.now());
    if (wasOffline) {
      await resolveOfflineAlert(
        sensorId,
        (await prisma.sensor.findUnique({ where: { id: sensorId } }))?.sensorCode ?? ""
      );
      wsHub.broadcast("sensor_status", { id: sensorId, status: "ONLINE" });
    }

    // Run alert engine (threshold violations)
    await evaluateThresholds(sensorId, temperature, humidity);

    const full = await prisma.sensorReading.findUnique({
      where: { id: reading.id },
      include: { sensor: { select: { id: true, sensorCode: true, name: true, location: true } } },
    });

    wsHub.broadcast("reading", full);
    return full;
  }

  startOfflineMonitor() {
    const check = async () => {
      const sensors = await prisma.sensor.findMany();
      const now = Date.now();
      for (const sensor of sensors) {
        if (sensor.status !== "ONLINE") continue;
        const last = lastContact.get(sensor.id);
        if (last && now - last > config.sensorOfflineTimeout) {
          await prisma.sensor.update({
            where: { id: sensor.id },
            data: { status: "OFFLINE" },
          });
          wsHub.broadcast("sensor_status", { id: sensor.id, status: "OFFLINE" });
          await createOfflineAlert(sensor.id);
        }
      }
    };
    setInterval(check, Math.max(15000, config.sensorOfflineTimeout));
    return check;
  }
}

export const readingService = new ReadingService();