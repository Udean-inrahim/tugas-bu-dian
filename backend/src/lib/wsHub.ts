import { WebSocket } from "ws";

class WsHub {
  private clients = new Set<WebSocket>();

  addClient(client: WebSocket) {
    this.clients.add(client);
  }

  removeClient(client: WebSocket) {
    this.clients.delete(client);
  }

  broadcast(event: string, payload: unknown) {
    const message = JSON.stringify({ event, data: payload });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch {
          /* client disconnected */
        }
      }
    }
  }

  get size() {
    return this.clients.size;
  }
}

export const wsHub = new WsHub();
export type { WebSocket as WsWebSocket };