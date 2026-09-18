import { PrismaClient } from "../src/generated/client/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const password = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@example.com",
      password,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // Default settings (id must be 1)
  const settings = await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      minTemperature: 18,
      maxTemperature: 30,
      minHumidity: 40,
      maxHumidity: 70,
      refreshInterval: 5,
    },
  });
  console.log("✅ Default settings created");

  // Demo sensor
  const sensor = await prisma.sensor.upsert({
    where: { sensorCode: "ST-001" },
    update: {},
    create: {
      sensorCode: "ST-001",
      name: "Server Room",
      location: "Building A",
      status: "OFFLINE",
    },
  });
  console.log(`✅ Demo sensor created: ${sensor.name} (${sensor.sensorCode})`);

  // Backfill demo readings for the last 24h so charts are populated immediately.
  // Idempotent: only fills 5-minute slots that do not already have data.
  const stepMs = 5 * 60 * 1000;
  const windowMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const windowStart = now - windowMs;

  const existing = await prisma.sensorReading.findMany({
    where: { sensorId: sensor.id, recordedAt: { gte: new Date(windowStart) } },
    select: { recordedAt: true },
  });
  const taken = new Set(existing.map((r) => Math.floor(r.recordedAt.getTime() / stepMs)));

  const rows: { sensorId: number; temperature: number; humidity: number; recordedAt: Date }[] = [];
  const firstSlot = Math.ceil(windowStart / stepMs) * stepMs;
  for (let t = firstSlot; t <= now; t += stepMs) {
    const slot = Math.floor(t / stepMs);
    if (taken.has(slot)) continue;
    const phase = (t / (12 * 60 * 60 * 1000)) * Math.PI * 2;
    const temperature = Number((24 + 4 * Math.sin(phase) + 0.6 * Math.sin(phase * 7)).toFixed(2));
    const humidity = Number((55 + 12 * Math.cos(phase * 0.8) + 1.5 * Math.sin(phase * 5)).toFixed(2));
    rows.push({ sensorId: sensor.id, temperature, humidity, recordedAt: new Date(t) });
  }
  if (rows.length > 0) {
    await prisma.sensorReading.createMany({ data: rows });
  }
  console.log(`✅ Demo readings backfilled: ${rows.length} (24h window)`);

  console.log("Seed selesai. Login: admin@example.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });