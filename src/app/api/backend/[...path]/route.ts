import { proxyToBackend } from "@/lib/proxy";

// All application data comes from the Express API. Browser requests hit this
// same-origin route first, so session cookies and Authorization headers are
// forwarded together and no backend URL or secret is exposed to the browser.
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ path: string[] }> };

async function handler(request: Request, context: Context) {
  const { path } = await context.params;
  const suffix = (path ?? []).map((segment) => encodeURIComponent(segment)).join("/");
  return proxyToBackend(request, `/api/${suffix}`);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;
