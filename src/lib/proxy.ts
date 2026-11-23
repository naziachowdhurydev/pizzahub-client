/**
 * Same-origin proxy helpers.
 *
 * The browser only talks to this Next.js app. Every auth and data request is
 * forwarded to the Express API, which owns the database, sessions and secrets.
 * This keeps cookies on one host and avoids cross-site cookie/CORS problems.
 */

const BACKEND_ORIGIN = (process.env.AUTH_BACKEND_URL || "http://localhost:5000").replace(
  /\/+$/,
  "",
);

function sanitizeCookie(cookie: string): string {
  // A Domain attribute from the API host would be rejected by the browser
  // when the response comes from the client host. Host-only cookies are correct.
  return cookie
    .split(";")
    .filter((part) => !/^\s*domain=/i.test(part))
    .join(";");
}

export async function proxyToBackend(request: Request, backendPath: string): Promise<Response> {
  const incoming = new URL(request.url);
  const target = `${BACKEND_ORIGIN}${backendPath}${incoming.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const hasBody = !["GET", "HEAD"].includes(request.method.toUpperCase());

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: `API is unreachable: ${error instanceof Error ? error.message : "unknown error"}`,
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("connection");

  const cookies = upstream.headers.getSetCookie?.() ?? [];
  if (cookies.length > 0) {
    responseHeaders.delete("set-cookie");
    for (const cookie of cookies) responseHeaders.append("set-cookie", sanitizeCookie(cookie));
  }

  const emptyBody = [204, 205, 304].includes(upstream.status);
  return new Response(emptyBody ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
