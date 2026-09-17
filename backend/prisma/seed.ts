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