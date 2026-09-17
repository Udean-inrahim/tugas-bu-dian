import { handle } from "hono/vercel";
import { app } from "../backend/dist/serverless/app.js";

const appHandler = handle(app);

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function isFetchRequest(v: unknown): v is Request {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Request).method === "string" &&
    typeof (v as Request).url === "string"
  );
}

async function runFetch(request: Request): Promise<Response> {
  try {
    return await app.fetch(request);
  } catch (e) {
    return json({ error: "REQUEST_ERROR", message: String((e as { stack?: string })?.stack ?? e) }, 500);
  }
}

async function readNodeBody(req: { on?: (event: string, cb: (chunk: Buffer) => void) => void; read?: () => Buffer | null }): Promise<Buffer | undefined> {
  if (req.on) {
    return await new Promise<Buffer | undefined>((resolve) => {
      const chunks: Buffer[] = [];
      req.on?.("data", (c) => chunks.push(c));
      req.on?.("end", () => resolve(Buffer.concat(chunks)));
    });
  }
  if (req.read) {
    const first = req.read();
    return first ?? undefined;
  }
  return undefined;
}

async function runNode(req: unknown, res: unknown): Promise<void> {
  const r = req as {
    method?: string;
    url?: string;
    headers?: Record<string, string | string[] | undefined>;
    on?: (event: string, cb: (chunk: Buffer) => void) => void;
    read?: () => Buffer | null;
  };
  const w = res as {
    statusCode?: number;
    setHeader?: (k: string, v: string) => void;
    end?: (body?: string) => void;
  };
  try {
    const headers = new Headers();
    if (r.headers) {
      for (const [k, v] of Object.entries(r.headers)) {
        if (v !== undefined && k.toLowerCase() !== "host") headers.set(k, Array.isArray(v) ? v.join(",") : v);
      }
    }
    const host = (r.headers as Record<string, string | string[] | undefined> | undefined)?.host;
    const method = (r.method ?? "GET").toUpperCase();
    const body =
      method === "GET" || method === "HEAD" ? undefined : await readNodeBody(r);
    const request = new Request(`https://${host ?? "tugas-bu-dian.vercel.app"}${r.url ?? "/"}`, {
      method,
      headers,
      body,
    });
    const response = await app.fetch(request);
    if (w.statusCode !== undefined) w.statusCode = response.status;
    if (w.setHeader) {
      for (const [k, v] of response.headers) w.setHeader(k, v);
    }
    if (w.end) w.end(await response.text());
  } catch (e) {
    if (w.statusCode !== undefined) w.statusCode = 500;
    if (w.setHeader) w.setHeader("content-type", "application/json");
    if (w.end) w.end(JSON.stringify({ error: "REQUEST_ERROR", message: String((e as { stack?: string })?.stack ?? e) }));
  }
}

function dispatch(v1: unknown, v2: unknown): Response | Promise<Response> | Promise<void> {
  if (v2 === undefined && isFetchRequest(v1)) {
    return runFetch(v1 as Request);
  }
  return runNode(v1, v2);
}

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const DELETE = dispatch;
export const PATCH = dispatch;
export const OPTIONS = dispatch;