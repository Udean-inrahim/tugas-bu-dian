import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { readingService } from "../services/reading.service.js";

const readingCreateSchema = z.object({
  sensor_id: z.number().int().positive(),
  temperature: z.number().min(-40).max(125),
  humidity: z.number().min(0).max(100),
});

const readingFromSensorSchema = z.object({
  sensor_code: z.string().min(1),
  temperature: z.number().min(-40).max(125),
  humidity: z.number().min(0).max(100),
});

function parseDateParam(value?: string): Date | undefined {
  if (!value) return undefined;
  const asNumber = Number(value);
  const date = Number.isFinite(asNumber) ? new Date(asNumber) : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function readingRoutes(app: FastifyInstance) {
  // Public ingest endpoint (ESP32 → HTTP fallback, authenticated with a service token header)
  app.post("/api/readings", async (req, reply) => {
    const body = req.body as Record<string, unknown>;

    // If sensor_code is present, treat as ESP32-style submission
    if (typeof body.sensor_code === "string") {
      const parsed = readingFromSensorSchema.safeParse(body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Input tidak valid",
        });
      }
      const reading = await readingService.ingestFromSensor(
        parsed.data.sensor_code,
        parsed.data.temperature,
        parsed.data.humidity
      );
      if (!reading) {
        return reply.code(404).send({ error: "NOT_FOUND", message: "Sensor tidak dikenal" });
      }
      return reply.code(201).send(reading);
    }

    const parsed = readingCreateSchema.safeParse(body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Input tidak valid",
      });
    }
    const reading = await readingService.recordReading(
      parsed.data.sensor_id,
      parsed.data.temperature,
      parsed.data.humidity
    );
    return reply.code(201).send(reading);
  });

  // Authenticated reading queries
  app.addHook("preHandler", app.authenticate);

  app.get("/api/readings/latest", async (req, reply) => {
    const { sensor_id } = req.query as { sensor_id?: string };
    const myIds = (
      await prisma.sensor.findMany({ where: { userId: req.user.sub }, select: { id: true } })
    ).map((s) => s.id);
    if (sensor_id) {
      if (!myIds.includes(Number(sensor_id))) {
        return reply.code(404).send({ error: "NOT_FOUND", message: "Sensor tidak ditemukan" });
      }
      const reading = await prisma.sensorReading.findFirst({
        where: { sensorId: Number(sensor_id) },
        orderBy: { recordedAt: "desc" },
        include: { sensor: true },
      });
      if (!reading) {
        return reply
          .code(404)
          .send({ error: "NOT_FOUND", message: "Belum ada data untuk sensor ini" });
      }
      return reading;
    }

    const readings = await prisma.sensorReading.findMany({
      where: { sensorId: { in: myIds } },
      orderBy: { recordedAt: "desc" },
      take: 1,
      include: { sensor: true },
    });
    return readings[0] ?? null;
  });

  app.get("/api/readings", async (req) => {
    const q = req.query as {
      sensor_id?: string;
      from?: string;
      to?: string;
      page?: string;
      limit?: string;
    };

    const page = Math.max(1, Number(q.page ?? 1) || 1);
    const limit = Math.min(200, Math.max(1, Number(q.limit ?? 50) || 50));
    const skip = (page - 1) * limit;

    const myIds = (
      await prisma.sensor.findMany({ where: { userId: req.user.sub }, select: { id: true } })
    ).map((s) => s.id);

    const where: Record<string, unknown> = {};
    if (q.sensor_id) {
      const sid = Number(q.sensor_id);
      where.sensorId = { in: myIds.includes(sid) ? [sid] : [] };
    } else {
      where.sensorId = { in: myIds };
    }
    const from = parseDateParam(q.from);
    const to = parseDateParam(q.to);
    if (from) where.recordedAt = { ...((where.recordedAt as object) ?? {}), gte: from };
    if (to) where.recordedAt = { ...((where.recordedAt as object) ?? {}), lte: to };

    const [total, data] = await Promise.all([
      prisma.sensorReading.count({ where }),
      prisma.sensorReading.findMany({
        where,
        orderBy: { recordedAt: "desc" },
        skip,
        take: limit,
        include: { sensor: { select: { sensorCode: true, name: true, location: true } } },
      }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });
}