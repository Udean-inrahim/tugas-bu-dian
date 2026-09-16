import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { getActiveSettings, updateSettings } from "../services/settings.service.js";

const settingsSchema = z
  .object({
    minTemperature: z.number(),
    maxTemperature: z.number(),
    minHumidity: z.number(),
    maxHumidity: z.number(),
    refreshInterval: z.number().int().min(1).max(300),
  })
  .refine((s) => s.minTemperature < s.maxTemperature, {
    message: "Minimum temperature harus lebih kecil dari maksimum temperature",
    path: ["minTemperature"],
  })
  .refine((s) => s.minHumidity < s.maxHumidity, {
    message: "Minimum humidity harus lebih kecil dari maksimum humidity",
    path: ["minHumidity"],
  });

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/api/settings", async () => {
    return getActiveSettings();
  });

  app.put("/api/settings", { preHandler: app.requireAdmin }, async (req, reply) => {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Pengaturan tidak valid",
      });
    }
    const updated = await updateSettings(parsed.data);
    return updated;
  });
}