import { NextRequest, NextResponse } from "next/server";

const AUTH_BACKEND_URL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:5000";

export async function GET(request: NextRequest, context: { params: Promise<{ all: string[] }> }) {
  const params = await context.params;
  return handleProxy(request, params.all);
}

export async function POST(request: NextRequest, context: { params: Promise<{ all: string[] }> }) {
  const params = await context.params;
  return handleProxy(request, params.all);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ all: string[] }> }) {
  const params = await context.params;
  return handleProxy(request, params.all);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ all: string[] }> }) {
  const params = await context.params;
  return handleProxy(request, params.all);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ all: string[] }> }) {
  const params = await context.params;
  return handleProxy(request, params.all);
}

async function handleProxy(request: NextRequest, allParams: string[]) {
  const subPath = allParams?.join("/") || "";
  const targetUrl = `${AUTH_BACKEND_URL}/api/auth/${subPath}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      headers.set(key, value);
    }
  });

  const body =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : undefined;

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      responseHeaders.append(key, value);
    });

    const resBody = await res.arrayBuffer();
    return new NextResponse(resBody, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Auth proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Could not reach auth server." },
      { status: 502 }
    );
  }
}
