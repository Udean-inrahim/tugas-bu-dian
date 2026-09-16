import fastifyPlugin from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import jwt from "@fastify/jwt";
import { config } from "../config/index.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: number;
      email: string;
      role: "ADMIN" | "USER";
    };
    user: {
      sub: number;
      email: string;
      role: "ADMIN" | "USER";
    };
  }
}

export const authPlugin = fastifyPlugin(async (app: FastifyInstance) => {
  await app.register(jwt, {
    secret: config.jwt.secret,
  });

  app.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.code(401).send({ error: "UNAUTHORIZED", message: "Token tidak valid atau kedaluwarsa" });
    }
  });

  app.decorate("requireAdmin", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
      if ((req.user as { role: string }).role !== "ADMIN") {
        return reply.code(403).send({
          error: "FORBIDDEN",
          message: "Hanya admin yang dapat mengakses endpoint ini",
        });
      }
    } catch {
      return reply.code(401).send({
        error: "UNAUTHORIZED",
        message: "Token tidak valid atau kedaluwarsa",
      });
    }
  });
});