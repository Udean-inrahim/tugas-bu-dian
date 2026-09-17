import { handle } from "hono/vercel";

let app: Awaited<ReturnType<typeof loadApp>> | undefined;
let loadError: unknown;

async function loadApp() {
  const mod = await import("../backend/dist/serverless/app.js");
  return mod.app;
}

const ready = loadApp()
  .then((a) => {
    app = a;
    return true;
  })
  .catch((e) => {
    loadError = e;
    return false;
  });

function handler(req: Parameters<ReturnType<typeof handle>>[0], res: Parameters<ReturnType<typeof handle>>[1]) {
  ready.then((ok) => {
    if (!ok) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          error: "FUNCTION_LOAD_ERROR",
          message: String((loadError as { stack?: string } | undefined)?.stack ?? loadError),
        })
      );
      return;
    }
    handle(app)(req, res);
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;