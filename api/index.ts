type AppModule = typeof import("../backend/dist/serverless/app.js");

let appModule: AppModule["app"] | null = null;
let appPromise: Promise<AppModule["app"]> | null = null;

function loadApp(): Promise<AppModule["app"]> {
  if (appModule) return Promise.resolve(appModule);
  if (!appPromise) {
    appPromise = import("../backend/dist/serverless/app.js")
      .then((m) => {
        appModule = m.app;
        return appModule;
      })
      .catch((e) => {
        appPromise = null;
        throw e;
      });
  }
  return appPromise;
}

type NodeReq = {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  on?: (event: string, cb: (chunk: Buffer) => void) => void;
  read?: () => Buffer | null;
};
type NodeRes = {
  statusCode?: number;
  setHeader?: (k: string, v: string) => void;
  end?: (body?: string) => void;
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function errorJson(data: unknown, status = 500) {
  return json(
    { error: "FUNCTION_ERROR", message: String((data as { stack?: string })?.stack ?? data) },
    status
  );
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
    const app = await loadApp();
    return await app.fetch(request);
  } catch (e) {
    return errorJson(e);
  }
}

async function readNodeBody(req: NodeReq): Promise<Buffer | undefined> {
  if (req.on) {
    return new Promise<Buffer | undefined>((resolve) => {
      const chunks: Buffer[] = [];
      req.on?.("data", (c) => chunks.push(c));
      req.on?.("end", () => resolve(Buffer.concat(chunks)));
    });
  }
  return req.read ? (req.read() ?? undefined) : undefined;
}

async function runNode(req: NodeReq, res: NodeRes): Promise<void> {
  try {
    const headers = new Headers();
    if (req.headers) {
      for (const [k, v] of Object.entries(req.headers)) {
        if (v !== undefined && k.toLowerCase() !== "host") headers.set(k, Array.isArray(v) ? v.join(",") : v);
      }
    }
    const host = req.headers?.host;
    const method = (req.method ?? "GET").toUpperCase();
    const body = method === "GET" || method === "HEAD" ? undefined : await readNodeBody(req);
    const request = new Request(`https://${host ?? "tugas-bu-dian.vercel.app"}${req.url ?? "/"}`, {
      method,
      headers,
      body,
    });
    const app = await loadApp();
    const response = await app.fetch(request);
    if (res.statusCode !== undefined) res.statusCode = response.status;
    if (res.setHeader) {
      for (const [k, v] of response.headers) res.setHeader(k, v);
    }
    if (res.end) res.end(await response.text());
  } catch (e) {
    if (res.statusCode !== undefined) res.statusCode = 500;
    if (res.setHeader) res.setHeader("content-type", "application/json");
    if (res.end) {
      res.end(
        JSON.stringify({ error: "FUNCTION_ERROR", message: String((e as { stack?: string })?.stack ?? e) })
      );
    }
  }
}

function handler(
  v1: Request | NodeReq,
  v2?: NodeRes
): Response | Promise<Response> | Promise<void> {
  if (v2 === undefined && isFetchRequest(v1)) {
    return runFetch(v1);
  }
  return runNode(v1 as NodeReq, v2 as NodeRes);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;