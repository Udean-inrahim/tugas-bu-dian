import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import { wsHub } from "../lib/wsHub.js";

export async function websocketRoute(app: FastifyInstance) {
  app.register(async (wsApp) => {
    wsApp.get("/ws", { websocket: true }, (socket) => {
      const rawWs = socket as unknown as WebSocket;

      wsHub.addClient(rawWs);

      rawWs.send(JSON.stringify({ event: "hello", data: { message: "Connected" } }));

      rawWs.on("close", () => wsHub.removeClient(rawWs));
      rawWs.on("error", () => wsHub.removeClient(rawWs));
    });
  });
}