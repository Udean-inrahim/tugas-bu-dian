import { handle } from "hono/vercel";
import { app } from "../backend/dist/serverless/app.js";

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;