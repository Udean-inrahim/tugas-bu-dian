import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { createResetCode, verifyResetCode, createVerifyCode, verifyVerifyCode } from "../lib/resetCode.js";
import { sendVerificationEmail, sendResetEmail } from "../lib/email.js";
import { config } from "../config/index.js";

const loginSchema = z.object({
  email: z.string().min(1, "Email atau username tidak boleh kosong"),
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

    const identifier = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: { equals: identifier, mode: "insensitive" } }],
      },
    });
    if (!user) {
      return reply.code(401).send({ error: "UNAUTHORIZED", message: "Email, username, atau password salah" });
    }

    const valid = await bcrypt.compare(parsed.data.password, user.password);
    if (!valid) {
      return reply.code(401).send({ error: "UNAUTHORIZED", message: "Email, username, atau password salah" });
    }

    if (!user.emailVerified) {
      return reply
        .code(403)
        .send({
          error: "EMAIL_NOT_VERIFIED",
          message: "Email belum diverifikasi. Cek inbox kamu atau minta kode verifikasi baru.",
        });
    }

    const token = app.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: config.jwt.expiresIn }
    );

    return reply.send({
      token,
      user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role },
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

  app.post("/api/auth/request-reset", async (req, reply) => {
    const schema = z.object({ email: z.string().email("Email tidak valid") });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Input tidak valid" });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) return reply.code(404).send({ error: "NOT_FOUND", message: "Email tidak terdaftar" });

    const { code, expiresAt } = createResetCode(user.email);
    const sent = await sendResetEmail(user.email, code);
    return reply.send({ email: user.email, expiresAt, emailSent: sent, ...(sent ? {} : { code }) });
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
      select: { id: true, name: true, email: true, username: true, role: true, createdAt: true },
    });
    if (!user) {
      const err = new Error("User tidak ditemukan") as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }
    return user;
  });

  // Update nama / username profil sendiri.
  app.put("/api/auth/me", { preHandler: app.authenticate }, async (req, reply) => {
    const userId = (req.user as { sub: number }).sub;
    const schema = z.object({
      name: z.string().min(1, "Nama wajib diisi").max(100).optional(),
      username: z
        .string()
        .min(3, "Username minimal 3 karakter")
        .max(20, "Username maksimal 20 karakter")
        .regex(/^[a-zA-Z0-9_.-]+$/, "Username hanya boleh huruf, angka, titik, garis bawah, atau strip")
        .transform((v) => v.trim())
        .optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION_ERROR", message: "Input tidak valid" });
    }

    if (parsed.data.username) {
      const taken = await prisma.user.findFirst({
        where: {
          username: { equals: parsed.data.username, mode: "insensitive" },
          id: { not: userId },
        },
      });
      if (taken) {
        return reply.code(409).send({ error: "USERNAME_TAKEN", message: "Username telah digunakan" });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.username !== undefined ? { username: parsed.data.username } : {}),
      },
      select: { id: true, name: true, email: true, username: true, role: true, createdAt: true },
    });
    return user;
  });

  app.post("/api/auth/register", async (req, reply) => {
    const schema = z.object({
      name: z.string().min(1, "Nama wajib diisi"),
      username: z
        .string()
        .min(3, "Username minimal 3 karakter")
        .max(20, "Username maksimal 20 karakter")
        .regex(/^[a-zA-Z0-9_.-]+$/, "Username hanya boleh huruf, angka, titik, garis bawah, atau strip")
        .transform((v) => v.trim()),
      email: z.string().email("Email tidak valid"),
      password: z.string().min(6, "Password minimal 6 karakter").optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION_ERROR", message: "Input tidak valid" });
    }

    const usernameTaken = await prisma.user.findFirst({
      where: { username: { equals: parsed.data.username, mode: "insensitive" } },
    });
    if (usernameTaken) {
      return reply.code(409).send({ error: "USERNAME_TAKEN", message: "Username telah digunakan" });
    }

    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (exists) {
      if (!exists.emailVerified) {
        const { code, expiresAt } = createVerifyCode(exists.email);
        const sent = await sendVerificationEmail(exists.email, code);
        return reply.code(200).send({
          pendingVerification: true,
          email: exists.email,
          expiresAt,
          emailSent: sent,
          ...(sent ? {} : { code }),
        });
      }
      return reply.code(409).send({ error: "EMAIL_TAKEN", message: "Email sudah terdaftar" });
    }

    // Password boleh dikosongkan dulu; diisi pada langkah terakhir pendaftaran.
    const password = parsed.data.password
      ? await bcrypt.hash(parsed.data.password, 10)
      : await bcrypt.hash(`pending-${Date.now()}-${Math.random()}`, 10);
    let user: { id: number; name: string; email: string; username: string | null; role: string } | null = null;
    try {
      user = await prisma.user.create({
        data: {
          name: parsed.data.name,
          username: parsed.data.username,
          email: parsed.data.email,
          password,
          role: "USER",
          emailVerified: false,
        },
      });
    } catch (err) {
      if ((err as { code?: string })?.code === "P2002") {
        return reply.code(409).send({ error: "USERNAME_TAKEN", message: "Username telah digunakan" });
      }
      throw err;
    }

    const { code, expiresAt } = createVerifyCode(user.email);
    const sent = await sendVerificationEmail(user.email, code);

    return reply.code(201).send({
      pendingVerification: true,
      email: user.email,
      expiresAt,
      emailSent: sent,
      ...(sent ? {} : { code }),
    });
  });

  // Cek ketersediaan username secara langsung (sebelum submit).
  app.get("/api/auth/check-username", async (req, reply) => {
    const username = String((req.query as { username?: unknown } | undefined)?.username ?? "").trim();
    if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(username)) {
      return reply.send({ available: false, valid: false });
    }
    const taken = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });
    return reply.send({ available: !taken, valid: true });
  });

  // Validasi kode verifikasi (tanpa efek samping) sebelum password dimasukkan.
  app.post("/api/auth/verify-code", async (req, reply) => {
    const schema = z.object({
      email: z.string().email("Email tidak valid"),
      code: z.string().min(4, "Kode verifikasi wajib diisi"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION_ERROR", message: "Input tidak valid" });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) return reply.code(404).send({ error: "NOT_FOUND", message: "Email tidak terdaftar" });
    if (user.emailVerified) return { valid: true };

    if (!verifyVerifyCode(user.email, parsed.data.code)) {
      return reply.code(400).send({ error: "INVALID_CODE", message: "Kode verifikasi salah atau kedaluwarsa" });
    }
    return { valid: true };
  });

  app.post("/api/auth/verify-email", async (req, reply) => {
    const schema = z.object({
      email: z.string().email("Email tidak valid"),
      code: z.string().min(4, "Kode verifikasi wajib diisi"),
      password: z.string().min(6, "Password minimal 6 karakter").optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Input tidak valid" });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) return reply.code(404).send({ error: "NOT_FOUND", message: "Email tidak terdaftar" });

    const applyPassword =
      parsed.data.password !== undefined
        ? await bcrypt.hash(parsed.data.password, 10)
        : undefined;

    const signToken = (u: { id: number; email: string; role: "ADMIN" | "USER" }) =>
      app.jwt.sign({ sub: u.id, email: u.email, role: u.role }, { expiresIn: config.jwt.expiresIn });

    if (user.emailVerified) {
      const updated = applyPassword
        ? await prisma.user.update({ where: { id: user.id }, data: { password: applyPassword } })
        : user;
      return reply.send({
        token: signToken(updated),
        user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
      });
    }

    if (!verifyVerifyCode(user.email, parsed.data.code)) {
      return reply.code(400).send({ error: "INVALID_CODE", message: "Kode verifikasi salah atau kedaluwarsa" });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, ...(applyPassword ? { password: applyPassword } : {}) },
    });

    return reply.send({
      token: signToken(updated),
      user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
    });
  });

  app.post("/api/auth/resend-verification", async (req, reply) => {
    const schema = z.object({ email: z.string().email("Email tidak valid") });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Input tidak valid" });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) return reply.code(404).send({ error: "NOT_FOUND", message: "Email tidak terdaftar" });
    if (user.emailVerified) {
      return reply.code(400).send({ error: "ALREADY_VERIFIED", message: "Email sudah diverifikasi" });
    }

    const { code, expiresAt } = createVerifyCode(user.email);
    const sent = await sendVerificationEmail(user.email, code);
    return reply.send({ email: user.email, expiresAt, emailSent: sent, ...(sent ? {} : { code }) });
  });
}