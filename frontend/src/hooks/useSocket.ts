import { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";

export type SocketEvent =
  | "reading"
  | "alert"
  | "alert_resolved"
  | "sensor_status"
  | "hello"
  | "error";

type SocketCallback = (payload: unknown) => void;

interface SocketHandlers {
  onOpen?: () => void;
  onClose?: () => void;
}

export function useSocket(handlers?: SocketHandlers) {
  const token = useAuthStore((s) => s.token);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlersRef = useRef<Record<SocketEvent, SocketCallback[]>>({
    reading: [],
    alert: [],
    alert_resolved: [],
    sensor_status: [],
    hello: [],
    error: [],
  });
  const shouldReconnectRef = useRef(true);

  const registerHandler = useCallback((event: SocketEvent, cb: SocketCallback) => {
    handlersRef.current[event].push(cb);
    return () => {
      const list = handlersRef.current[event];
      const idx = list.indexOf(cb);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
    };
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let disposed = false;

    const connect = () => {
      if (disposed) {
        return;
      }
      shouldReconnectRef.current = true;
      const wsUrl =
        import.meta.env.VITE_WS_URL ??
        `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
      const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        handlers?.onOpen?.();
      };

      ws.onclose = () => {
        handlers?.onClose?.();
        if (shouldReconnectRef.current && !disposed) {
          reconnectRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onmessage = (message) => {
        try {
          const parsed = JSON.parse(message.data as string) as {
            event: SocketEvent;
            data?: unknown;
          };
          const cbs = handlersRef.current[parsed.event];
          cbs.forEach((cb) => cb(parsed.data));
        } catch {
          const cbs = handlersRef.current.error;
          cbs.forEach((cb) => cb(message.data));
        }
      };
    };

    connect();

    return () => {
      disposed = true;
      shouldReconnectRef.current = false;
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
      wsRef.current?.close();
    };
  }, [token, handlers?.onOpen, handlers?.onClose]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
    }
    wsRef.current?.close();
  }, []);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, []);

  return { registerHandler, disconnect, reconnect };
}