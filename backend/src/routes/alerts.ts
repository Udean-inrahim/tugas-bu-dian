import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { resolveAlert } from "../services/alert.service.js";

export async function alertRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/api/alerts", async (req) => {
    const q = req.query as {
      status?: "ACTIVE" | "RESOLVED" | "ALL";
      sensor_id?: string;
      severity?: string;
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
    if (q.status && q.status !== "ALL") where.status = q.status;
    if (q.sensor_id) {
      const sid = Number(q.sensor_id);
      where.sensorId = { in: myIds.includes(sid) ? [sid] : [] };
    } else {
      where.sensorId = { in: myIds };
    }
    if (q.severity) where.severity = q.severity;

    const [total, data] = await Promise.all([
      prisma.alert.count({ where }),
      prisma.alert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { sensor: { select: { sensorCode: true, name: true, location: true } } },
      }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });

  app.get("/api/alerts/summary", async (req) => {
    const myIds = (
      await prisma.sensor.findMany({ where: { userId: req.user.sub }, select: { id: true } })
    ).map((s) => s.id);
    const base = { status: "ACTIVE" as const, sensorId: { in: myIds } };
    const [active, critical, warning] = await Promise.all([
      prisma.alert.count({ where: base }),
      prisma.alert.count({ where: { ...base, severity: "CRITICAL" } }),
      prisma.alert.count({ where: { ...base, severity: "WARNING" } }),
    ]);
    return { active, critical, warning };
  });

  app.put("/api/alerts/:id/resolve", async (req, reply) => {
    const { id } = req.params as { id: string };
    const alertId = Number(id);
    const alert = await prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) {
      return reply.code(404).send({ error: "NOT_FOUND", message: "Alert tidak ditemukan" });
    }
    const myIds = (
      await prisma.sensor.findMany({ where: { userId: req.user.sub }, select: { id: true } })
    ).map((s) => s.id);
    if (!myIds.includes(alert.sensorId)) {
      return reply.code(404).send({ error: "NOT_FOUND", message: "Alert tidak ditemukan" });
    }
    const updated = await resolveAlert(alertId);
    return updated;
  });
}