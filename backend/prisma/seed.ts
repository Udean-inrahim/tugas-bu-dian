import { PrismaClient } from "../src/generated/client/index.js";
import { demoReading } from "../src/lib/demoData.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Ensure the email_verified column exists (schema is applied via raw DDL because
  // `prisma migrate` cannot run reliably over Neon's pooled connection).
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean NOT NULL DEFAULT false'
  );

  // Ensure the username column exists (nullable, unique) and backfill existing
  // users with a unique username derived from their email local-part.
  await prisma.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" text');
  const missingUsernames = await prisma.$queryRawUnsafe<{ id: number }[]>(
    'SELECT id FROM "users" WHERE "username" IS NULL'
  );
  for (const { id } of missingUsernames) {
    // Build a unique username: base = email-local-part; append -2, -3 ... if taken.
    const base = (await prisma.$queryRawUnsafe<{ candidate: string }[]>(
      'SELECT lower(split_part("email", \'@\', 1)) AS candidate FROM "users" WHERE "id" = $1',
      id
    ))?.[0]?.candidate ?? `user${id}`;
    let candidate = base;
    let n = 2;
    for (;;) {
      const taken = await prisma.$queryRawUnsafe<{ id: number }[]>(
        'SELECT id FROM "users" WHERE "username" = $1::text',
        candidate
      );
      if (taken.length === 0) break;
      candidate = `${base}-${n}`;
      n += 1;
    }
    await prisma.$executeRawUnsafe('UPDATE "users" SET "username" = $1::text WHERE "id" = $2', candidate, id);
  }
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username")'
  );

  // Admin user
  const password = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { emailVerified: true },
    create: {
      name: "Admin",
      username: "admin",
      email: "admin@example.com",
      password,
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log(`✅ Admin user created: ${admin.email} (login juga bisa pakai username "admin")`);

  // Ensure the sensors.user_id column exists and backfill existing sensors to
  // the admin account (per-account ownership migration).
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "sensors" ADD COLUMN IF NOT EXISTS "user_id" integer'
  );
  await prisma.$executeRawUnsafe(
    `UPDATE "sensors" SET "user_id" = (SELECT id FROM "users" WHERE role = 'ADMIN' ORDER BY id LIMIT 1) WHERE "user_id" IS NULL`
  );

  // API key per sensor (hash SHA-256, unik; key mentah hanya ditampilkan sekali
  // saat sensor dibuat/di-regenerate). Kolom nullable agar sensor lama tetap
  // bisa kirim data sampai owner membuat key-nya.
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "sensors" ADD COLUMN IF NOT EXISTS "api_key_hash" text'
  );
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "sensors_api_key_hash_key" ON "sensors"("api_key_hash")'
  );

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

  // Demo sensor (milik admin)
  const sensor = await prisma.sensor.upsert({
    where: { sensorCode: "ST-001" },
    update: { userId: admin.id },
    create: {
      sensorCode: "ST-001",
      name: "Server Room",
      location: "Building A",
      status: "OFFLINE",
      userId: admin.id,
    },
  });
  console.log(`✅ Demo sensor created: ${sensor.name} (${sensor.sensorCode})`);

  // Backfill demo readings for the last 7 days so the 7-day chart is populated.
  // Jendela 7 hari dibangun ulang dengan pola realistis (idempotent: data lama
  // di jendela dihapus dulu, jadi aman dijalankan ulang tiap deploy).
  const demoMode = (process.env.DEMO_MODE ?? "true") !== "false";
  const stepMs = 5 * 60 * 1000;
  const windowMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const windowStart = now - windowMs;

  if (demoMode) {
    await prisma.sensorReading.deleteMany({
      where: { sensorId: sensor.id, recordedAt: { gte: new Date(windowStart) } },
    });
  }

  const existing = demoMode
    ? []
    : await prisma.sensorReading.findMany({
        where: { sensorId: sensor.id, recordedAt: { gte: new Date(windowStart) } },
        select: { recordedAt: true },
      });
  const taken = new Set(existing.map((r) => Math.floor(r.recordedAt.getTime() / stepMs)));

  const rows: { sensorId: number; temperature: number; humidity: number; recordedAt: Date }[] = [];
  const firstSlot = Math.ceil(windowStart / stepMs) * stepMs;
  for (let t = firstSlot; t <= now; t += stepMs) {
    const slot = Math.floor(t / stepMs);
    if (taken.has(slot)) continue;
    const { temperature, humidity } = demoReading(t);
    rows.push({ sensorId: sensor.id, temperature, humidity, recordedAt: new Date(t) });
  }
  if (rows.length > 0) {
    await prisma.sensorReading.createMany({ data: rows });
  }
  console.log(`✅ Demo readings backfilled: ${rows.length} (7-day window)`);

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