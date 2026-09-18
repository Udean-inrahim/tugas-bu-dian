import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { createResetCode, verifyResetCode } from "../lib/resetCode.js";
import { config } from "../config/index.js";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Input tidak valid",
      });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.code(401).send({ error: "UNAUTHORIZED", message: "Email atau password salah" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return reply.code(401).send({ error: "UNAUTHORIZED", message: "Email atau password salah" });
    }

    const token = app.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: config.jwt.expiresIn }
    );

    return reply.send({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  });

  app.post("/api/auth/logout", async () => {
    // JWT is stateless; client discards token.
    return { success: true };
  });

  app.post("/api/auth/reset-password", async (req, reply) => {
    const schema = z.object({
      email: z.string().email("Email tidak valid"),
      code: z.string().min(4, "Kode reset wajib diisi"),
      newPassword: z.string().min(6, "Password minimal 6 karakter"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Input tidak valid" });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) return reply.code(404).send({ error: "NOT_FOUND", message: "Email tidak terdaftar" });
    if (!verifyResetCode(user.email, parsed.data.code)) {
      return reply.code(400).send({ error: "INVALID_CODE", message: "Kode reset salah atau kedaluwarsa" });
    }

    const password = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password } });
    return { success: true };
  });

  app.post("/api/auth/reset-code", { preHandler: app.requireAdmin }, async (req, reply) => {
    const schema = z.object({ email: z.string().email("Email tidak valid") });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Input tidak valid" });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) return reply.code(404).send({ error: "NOT_FOUND", message: "Email tidak terdaftar" });

    const { code, expiresAt } = createResetCode(user.email);
    return { email: user.email, name: user.name, code, expiresAt };
  });

  app.get("/api/auth/me", { preHandler: app.authenticate }, async (req) => {
    const userId = (req.user as { sub: number }).sub;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) {
      const err = new Error("User tidak ditemukan") as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }
    return user;
  });

  app.post("/api/auth/register", async (req, reply) => {
    const schema = z.object({
      name: z.string().min(1, "Nama wajib diisi"),
      email: z.string().email("Email tidak valid"),
      password: z.string().min(6, "Password minimal 6 karakter"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION_ERROR", message: "Input tidak valid" });
    }

    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (exists) {
      return reply.code(409).send({ error: "EMAIL_TAKEN", message: "Email sudah terdaftar" });
    }

    const password = await bcrypt.hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: { name: parsed.data.name, email: parsed.data.email, password, role: "USER" },
    });

    const token = app.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: config.jwt.expiresIn }
    );

    return reply.code(201).send({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  });
}