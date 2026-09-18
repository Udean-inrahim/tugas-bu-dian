import { Hono, type Context } from "hono";
import { jwt, sign } from "hono/jwt";
import { cors } from "hono/cors";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma.js";
import { createResetCode, verifyResetCode } from "../lib/resetCode.js";
import { getActiveSettings, updateSettings } from "./settings.js";
import {
  evaluateThresholds,
  resolveAlert,
  resolveOfflineAlerts,
  createOfflineAlert,
} from "./alerts.js";
import type { AlertType, SensorStatus, Severity } from "../generated/client/index.js";

type Vars = {
  jwtPayload: { sub: string; email: string; role: string };
  user: { id: number; email: string; role: string };
};

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const SENSOR_OFFLINE_TIMEOUT = Number(process.env.SENSOR_OFFLINE_TIMEOUT ?? 120000);
const SERVICE_TOKEN = process.env.SERVICE_TOKEN ?? "";

function expiresInSeconds(value: string | undefined): number {
  const m = /^(\d+)\s*([smhd])?$/.exec((value ?? "1d").trim());
  if (!m) return 86400;
  const n = parseInt(m[1], 10);
  switch (m[2]) {
    case "s": return n;
    case "m": return n * 60;
    case "h": return n * 3600;
    default: return n * 86400;
  }
}

function tokenFor(user: { id: number; email: string; role: string }) {
  return sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds(process.env.JWT_EXPIRES_IN),
    },
    JWT_SECRET
  );
}

function publicUser(user: { id: number; name: string; email: string; role: string }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function isAdmin(c: Context<{ Variables: Vars }>) {
  return c.get("user").role === "ADMIN";
}

function isOnline(sensor: { isActive: boolean }, last: Date | undefined | null) {
  if (!sensor.isActive) return "OFFLINE" satisfies SensorStatus;
  if (!last) return "OFFLINE" satisfies SensorStatus;
  return Date.now() - last.getTime() <= SENSOR_OFFLINE_TIMEOUT ? "ONLINE" : "OFFLINE";
}

async function latestBySensor(sensorIds: number[]) {
  const map = new Map<number, Date>();
  if (sensorIds.length === 0) return map;
  const rows = await prisma.sensorReading.groupBy({
    by: ["sensorId"],
    where: { sensorId: { in: sensorIds } },
    _max: { recordedAt: true },
  });
  for (const row of rows) {
    if (row._max.recordedAt) map.set(row.sensorId, new Date(row._max.recordedAt));
  }
  return map;
}

async function recordReading(sensorId: number, temperature: number, humidity: number) {
  const reading = await prisma.sensorReading.create({
    data: { sensorId, temperature, humidity },
  });
  const wasOffline =
    (await prisma.sensor.findUnique({ where: { id: sensorId } }))?.status === "OFFLINE";
  await prisma.sensor.update({ where: { id: sensorId }, data: { status: "ONLINE" } });
  if (wasOffline) {
    await resolveOfflineAlerts(sensorId);
  }
  await evaluateThresholds(sensorId, temperature, humidity);
  return prisma.sensorReading.findUnique({
    where: { id: reading.id },
    include: {
      sensor: { select: { id: true, sensorCode: true, name: true, location: true } },
    },
  });
}

const readingInlineSchema = z.object({
  sensor_id: z.number().int().positive(),
  temperature: z.number().min(-40).max(125),
  humidity: z.number().min(0).max(100),
});

const readingSensorSchema = z.object({
  sensor_code: z.string().min(1),
  temperature: z.number().min(-40).max(125),
  humidity: z.number().min(0).max(100),
});

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

function validationError(error: z.ZodError) {
  return { error: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Input tidak valid" };
}

function pagination(q: URLSearchParams) {
  const page = Math.max(1, Number(q.get("page") ?? 1) || 1);
  const limit = Math.min(200, Math.max(1, Number(q.get("limit") ?? 50) || 50));
  return { page, limit, skip: (page - 1) * limit };
}

function parseDateParam(value?: string): Date | undefined {
  if (!value) return undefined;
  const asNumber = Number(value);
  const date = Number.isFinite(asNumber) ? new Date(asNumber) : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

const app = new Hono<{ Variables: Vars }>();

app.onError((err, c) => {
  console.error(err);
  return c.json(
    { error: "INTERNAL", message: err instanceof Error ? err.message : String(err) },
    500
  );
});

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use("/api/*", cors());

// ---- Public routes ----
app.post("/api/auth/login", async (c) => {
  const schema = z.object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json(validationError(parsed.error), 400);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return c.json({ error: "UNAUTHORIZED", message: "Email atau password salah" }, 401);

  const valid = await bcrypt.compare(parsed.data.password, user.password);
  if (!valid) return c.json({ error: "UNAUTHORIZED", message: "Email atau password salah" }, 401);

  const token = await tokenFor(user);
  return c.json({ token, user: publicUser(user) });
});

app.post("/api/auth/register", async (c) => {
  const schema = z.object({
    name: z.string().min(1, "Nama wajib diisi"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json(validationError(parsed.error), 400);

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return c.json({ error: "EMAIL_TAKEN", message: "Email sudah terdaftar" }, 409);

  const password = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, password, role: "USER" },
  });
  const token = await tokenFor(user);
  return c.json({ token, user: publicUser(user) }, 201);
});

app.post("/api/auth/logout", (c) => c.json({ success: true }));

app.post("/api/auth/reset-password", async (c) => {
  const schema = z.object({
    email: z.string().email("Email tidak valid"),
    code: z.string().min(4, "Kode reset wajib diisi"),
    newPassword: z.string().min(6, "Password minimal 6 karakter"),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json(validationError(parsed.error), 400);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return c.json({ error: "NOT_FOUND", message: "Email tidak terdaftar" }, 404);
  if (!verifyResetCode(user.email, parsed.data.code)) {
    return c.json({ error: "INVALID_CODE", message: "Kode reset salah atau kedaluwarsa" }, 400);
  }

  const password = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password } });
  return c.json({ success: true });
});

// Public ingest (ESP32 / GitHub Actions simulator)
app.post("/api/readings", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  if (typeof body.sensor_code === "string") {
    const parsed = readingSensorSchema.safeParse(body);
    if (!parsed.success) return c.json(validationError(parsed.error), 400);
    const sensor = await prisma.sensor.findUnique({ where: { sensorCode: parsed.data.sensor_code } });
    if (!sensor) return c.json({ error: "NOT_FOUND", message: "Sensor tidak dikenal" }, 404);
    const reading = await recordReading(sensor.id, parsed.data.temperature, parsed.data.humidity);
    return c.json(reading, 201);
  }

  const parsed = readingInlineSchema.safeParse(body);
  if (!parsed.success) return c.json(validationError(parsed.error), 400);
  const reading = await recordReading(
    parsed.data.sensor_id,
    parsed.data.temperature,
    parsed.data.humidity
  );
  return c.json(reading, 201);
});

// Periodic offline detection, called by GitHub Actions
app.post("/api/system/tick", async (c) => {
  if (c.req.header("x-service-token") !== SERVICE_TOKEN) {
    return c.json({ error: "UNAUTHORIZED", message: "Invalid service token" }, 401);
  }
  const sensors = await prisma.sensor.findMany({ where: { isActive: true } });
  const last = await latestBySensor(sensors.map((s) => s.id));
  let offlineMarked = 0;
  let offlineAlertsCreated = 0;
  for (const sensor of sensors) {
    if (isOnline(sensor, last.get(sensor.id)) === "ONLINE") continue;
    await prisma.sensor.update({ where: { id: sensor.id }, data: { status: "OFFLINE" } });
    offlineMarked++;
    const created = await createOfflineAlert(sensor.id);
    if (created) offlineAlertsCreated++;
  }
  return c.json({
    ok: true,
    checked: sensors.length,
    offlineMarked,
    offlineAlertsCreated,
    timestamp: new Date().toISOString(),
  });
});

// ---- Authenticated routes ----
app.use("/api/*", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/*", async (c, next) => {
  const p = c.get("jwtPayload");
  c.set("user", {
    id: Number(p.sub),
    email: String(p.email ?? ""),
    role: String(p.role ?? ""),
  });
  await next();
});

app.get("/api/auth/me", async (c) => {
  const user = await prisma.user.findUnique({
    where: { id: c.get("user").id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) return c.json({ error: "UNAUTHORIZED", message: "User tidak ditemukan" }, 401);
  return c.json(user);
});

app.post("/api/auth/reset-code", async (c) => {
  if (!isAdmin(c)) return c.json({ error: "FORBIDDEN", message: "Akses ditolak" }, 403);
  const schema = z.object({ email: z.string().email("Email tidak valid") });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json(validationError(parsed.error), 400);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return c.json({ error: "NOT_FOUND", message: "Email tidak terdaftar" }, 404);

  const { code, expiresAt } = createResetCode(user.email);
  return c.json({ email: user.email, name: user.name, code, expiresAt });
});

app.get("/api/sensors", async (c) => {
  const sensors = await prisma.sensor.findMany({ orderBy: { createdAt: "asc" } });
  const last = await latestBySensor(sensors.map((s) => s.id));
  const data = sensors.map((s) => ({ ...s, status: isOnline(s, last.get(s.id)) }));
  return c.json({ data });
});

app.get("/api/sensors/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "INVALID_ID", message: "ID tidak valid" }, 400);
  const sensor = await prisma.sensor.findUnique({ where: { id } });
  if (!sensor) return c.json({ error: "NOT_FOUND", message: "Sensor tidak ditemukan" }, 404);
  const lastReading = await prisma.sensorReading.findFirst({
    where: { sensorId: id },
    orderBy: { recordedAt: "desc" },
  });
  return c.json({ ...sensor, status: isOnline(sensor, lastReading?.recordedAt), lastReading });
});

app.post("/api/sensors", async (c) => {
  if (!isAdmin(c)) return c.json({ error: "FORBIDDEN", message: "Akses ditolak" }, 403);
  const parsed = sensorCreateSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json(validationError(parsed.error), 400);
  const exists = await prisma.sensor.findUnique({ where: { sensorCode: parsed.data.sensorCode } });
  if (exists) return c.json({ error: "CODE_TAKEN", message: "Sensor code sudah digunakan" }, 409);
  const sensor = await prisma.sensor.create({ data: parsed.data });
  return c.json(sensor, 201);
});

app.put("/api/sensors/:id", async (c) => {
  if (!isAdmin(c)) return c.json({ error: "FORBIDDEN", message: "Akses ditolak" }, 403);
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "INVALID_ID", message: "ID tidak valid" }, 400);
  const parsed = sensorUpdateSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json(validationError(parsed.error), 400);
  const sensor = await prisma.sensor.findUnique({ where: { id } });
  if (!sensor) return c.json({ error: "NOT_FOUND", message: "Sensor tidak ditemukan" }, 404);
  const updated = await prisma.sensor.update({ where: { id }, data: parsed.data });
  return c.json(updated);
});

app.delete("/api/sensors/:id", async (c) => {
  if (!isAdmin(c)) return c.json({ error: "FORBIDDEN", message: "Akses ditolak" }, 403);
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "INVALID_ID", message: "ID tidak valid" }, 400);
  const sensor = await prisma.sensor.findUnique({ where: { id } });
  if (!sensor) return c.json({ error: "NOT_FOUND", message: "Sensor tidak ditemukan" }, 404);
  await prisma.sensor.delete({ where: { id } });
  return c.body(null, 204);
});

app.patch("/api/sensors/:id/toggle", async (c) => {
  if (!isAdmin(c)) return c.json({ error: "FORBIDDEN", message: "Akses ditolak" }, 403);
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "INVALID_ID", message: "ID tidak valid" }, 400);
  const sensor = await prisma.sensor.findUnique({ where: { id } });
  if (!sensor) return c.json({ error: "NOT_FOUND", message: "Sensor tidak ditemukan" }, 404);
  const updated = await prisma.sensor.update({
    where: { id },
    data: { isActive: !sensor.isActive },
  });
  return c.json(updated);
});

app.get("/api/readings/latest", async (c) => {
  const sensorId = c.req.query("sensor_id");
  if (sensorId) {
    const reading = await prisma.sensorReading.findFirst({
      where: { sensorId: Number(sensorId) },
      orderBy: { recordedAt: "desc" },
      include: { sensor: { select: { id: true, sensorCode: true, name: true, location: true } } },
    });
    if (!reading) return c.json({ error: "NOT_FOUND", message: "Belum ada data untuk sensor ini" }, 404);
    return c.json(reading);
  }
  const reading = await prisma.sensorReading.findFirst({
    orderBy: { recordedAt: "desc" },
    include: { sensor: { select: { id: true, sensorCode: true, name: true, location: true } } },
  });
  return c.json(reading ?? null);
});

app.get("/api/readings", async (c) => {
  const q = c.req.queries();
  const { page, limit, skip } = pagination(new URLSearchParams(c.req.url.split("?")[1] ?? ""));
  const where: Record<string, unknown> = {};
  if (q.sensor_id?.[0]) where.sensorId = Number(q.sensor_id[0]);
  const from = parseDateParam(q.from?.[0]);
  const to = parseDateParam(q.to?.[0]);
  if (from) where.recordedAt = { ...((where.recordedAt as object) ?? {}), gte: from };
  if (to) where.recordedAt = { ...((where.recordedAt as object) ?? {}), lte: to };

  const [total, data] = await Promise.all([
    prisma.sensorReading.count({ where }),
    prisma.sensorReading.findMany({
      where,
      orderBy: { recordedAt: "desc" },
      skip,
      take: limit,
      include: { sensor: { select: { id: true, sensorCode: true, name: true, location: true } } },
    }),
  ]);

  return c.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

app.get("/api/alerts", async (c) => {
  const q = new URLSearchParams(c.req.url.split("?")[1] ?? "");
  const { page, limit, skip } = pagination(q);
  const where: Record<string, unknown> = {};
  const status = q.get("status");
  if (status && status !== "ALL") where.status = status;
  if (q.get("sensor_id")) where.sensorId = Number(q.get("sensor_id"));
  if (q.get("severity")) where.severity = q.get("severity");

  const [total, data] = await Promise.all([
    prisma.alert.count({ where }),
    prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { sensor: { select: { id: true, sensorCode: true, name: true, location: true } } },
    }),
  ]);

  return c.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

app.get("/api/alerts/summary", async (c) => {
  const [active, critical, warning] = await Promise.all([
    prisma.alert.count({ where: { status: "ACTIVE" } }),
    prisma.alert.count({ where: { status: "ACTIVE", severity: "CRITICAL" } }),
    prisma.alert.count({ where: { status: "ACTIVE", severity: "WARNING" } }),
  ]);
  return c.json({ active, critical, warning });
});

app.put("/api/alerts/:id/resolve", async (c) => {
  if (!isAdmin(c)) return c.json({ error: "FORBIDDEN", message: "Akses ditolak" }, 403);
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "INVALID_ID", message: "ID tidak valid" }, 400);
  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert) return c.json({ error: "NOT_FOUND", message: "Alert tidak ditemukan" }, 404);
  const updated = await resolveAlert(id);
  return c.json(updated);
});

app.get("/api/settings", async (c) => c.json(await getActiveSettings()));

app.put("/api/settings", async (c) => {
  if (!isAdmin(c)) return c.json({ error: "FORBIDDEN", message: "Akses ditolak" }, 403);
  const parsed = settingsSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json(validationError(parsed.error), 400);
  return c.json(await updateSettings(parsed.data));
});

export { app };
export type { AlertType, SensorStatus, Severity };