import { handle } from "hono/vercel";

let appPromise: Promise<typeof import("../backend/dist/serverless/app.js")["app"]> | null = null;

function getApp() {
  if (!appPromise) {
    appPromise = import("../backend/dist/serverless/app.js").then((m) => m.app);
  }
  return appPromise;
}

function isWebRequest(v: unknown): v is Request {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Request).clone === "function" &&
    typeof (v as Request).method === "string" &&
    typeof (v as Request).url === "string"
  );
}

async function invoke(request: Request): Promise<Response> {
  try {
    const app = await getApp();
    return await app.fetch(request);
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "FUNCTION_ERROR", message: String((e as { stack?: string })?.stack ?? e) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

async function nodeBridge(req: unknown, res: unknown): Promise<void> {
  const r = req as {
    method?: string;
    url?: string;
    headers?: Record<string, string | string[] | undefined>;
    body?: Buffer | string | null;
    on?: (event: string, cb: (chunk: Buffer) => void) => void;
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
    const host = r.headers?.host;
    const method = (r.method ?? "GET").toUpperCase();
    let body: Buffer | undefined;
    if (method !== "GET" && method !== "HEAD") {
      if (Buffer.isBuffer(r.body)) {
        body = r.body;
      } else if (typeof r.body === "string") {
        body = Buffer.from(r.body);
      } else if (r.on) {
        body = await new Promise<Buffer>((resolve) => {
          const chunks: Buffer[] = [];
          r.on?.("data", (c) => chunks.push(c));
          r.on?.("end", () => resolve(Buffer.concat(chunks)));
        });
      }
    }
    const app = await getApp();
    const response = await app.fetch(
      new Request(`https://${host ?? "tugas-bu-dian.vercel.app"}${r.url ?? "/"}`, {
        method,
        headers,
        body,
      })
    );
    if (w.statusCode !== undefined) w.statusCode = response.status;
    if (w.setHeader) {
      response.headers.forEach((v, k) => w.setHeader?.(k, v));
    }
    if (w.end) w.end(await response.text());
  } catch (e) {
    if (w.statusCode !== undefined) w.statusCode = 500;
    if (w.setHeader) w.setHeader("content-type", "application/json");
    if (w.end) w.end(JSON.stringify({ error: "FUNCTION_ERROR", message: String((e as { stack?: string })?.stack ?? e) }));
  }
}

function handler(v1: unknown, v2?: unknown) {
  if (isWebRequest(v1)) {
    return invoke(v1);
  }
  return nodeBridge(v1, v2);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;