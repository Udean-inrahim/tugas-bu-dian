import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const sensorCreateSchema = z.object({
  sensorCode: z.string().min(1, "Sensor code wajib diisi").max(20),
  name: z.string().min(1, "Nama wajib diisi").max(100),
  location: z.string().min(1, "Lokasi wajib diisi").max(150),
});

const sensorUpdateSchema = z.object({
  sensorCode: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  location: z.string().min(1).max(150).optional(),
  status: z.enum(["ONLINE", "OFFLINE"]).optional(),
});

export async function sensorRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/api/sensors", async (req) => {
    const sensors = await prisma.sensor.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: "asc" },
    });
    return { data: sensors };
  });

  app.get("/api/sensors/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const sensorId = Number(id);
    if (!Number.isInteger(sensorId)) {
      return reply.code(400).send({ error: "INVALID_ID", message: "ID tidak valid" });
    }
    const sensor = await prisma.sensor.findFirst({
      where: { id: sensorId, userId: req.user.sub },
      include: {
        readings: { orderBy: { recordedAt: "desc" }, take: 1 },
      },
    });
    if (!sensor) {
      return reply.code(404).send({ error: "NOT_FOUND", message: "Sensor tidak ditemukan" });
    }
    return sensor;
  });

  app.post("/api/sensors", async (req, reply) => {
    const parsed = sensorCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Input tidak valid",
      });
    }
    const exists = await prisma.sensor.findUnique({ where: { sensorCode: parsed.data.sensorCode } });
    if (exists) {
      return reply
        .code(409)
        .send({ error: "CODE_TAKEN", message: "Sensor code sudah digunakan" });
    }
    const sensor = await prisma.sensor.create({
      data: { ...parsed.data, userId: req.user.sub },
    });
    return reply.code(201).send(sensor);
  });

  app.put("/api/sensors/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const sensorId = Number(id);
    const parsed = sensorUpdateSchema.safeParse(req.body);
    if (!Number.isInteger(sensorId)) {
      return reply.code(400).send({ error: "INVALID_ID", message: "ID tidak valid" });
    }
    if (!parsed.success) {
      return reply.code(400).send({
        error: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Input tidak valid",
      });
    }
    const sensor = await prisma.sensor.findFirst({ where: { id: sensorId, userId: req.user.sub } });
    if (!sensor) {
      return reply.code(404).send({ error: "NOT_FOUND", message: "Sensor tidak ditemukan" });
    }
    const updated = await prisma.sensor.update({ where: { id: sensorId }, data: parsed.data });
    return updated;
  });

  app.delete("/api/sensors/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const sensorId = Number(id);
    if (!Number.isInteger(sensorId)) {
      return reply.code(400).send({ error: "INVALID_ID", message: "ID tidak valid" });
    }
    const sensor = await prisma.sensor.findFirst({ where: { id: sensorId, userId: req.user.sub } });
    if (!sensor) {
      return reply.code(404).send({ error: "NOT_FOUND", message: "Sensor tidak ditemukan" });
    }
    await prisma.sensor.delete({ where: { id: sensorId } });
    return reply.code(204).send();
  });

  app.patch("/api/sensors/:id/toggle", async (req, reply) => {
    const { id } = req.params as { id: string };
    const sensorId = Number(id);
    const sensor = await prisma.sensor.findFirst({ where: { id: sensorId, userId: req.user.sub } });
    if (!sensor) {
      return reply.code(404).send({ error: "NOT_FOUND", message: "Sensor tidak ditemukan" });
    }
    const updated = await prisma.sensor.update({
      where: { id: sensorId },
      data: { isActive: !sensor.isActive },
    });
    return updated;
  });
}