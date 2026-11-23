import { proxyToBackend } from "@/lib/proxy";

// Auth is handled only by the Express API. This route is a transparent,
// same-origin proxy so cookies stay on the client host and Google callbacks
// return through the client app.
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ all: string[] }> };

async function handler(request: Request, context: Context) {
  const { all } = await context.params;
  const path = (all ?? []).map((segment) => encodeURIComponent(segment)).join("/");
  return proxyToBackend(request, `/api/auth/${path}`);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;
