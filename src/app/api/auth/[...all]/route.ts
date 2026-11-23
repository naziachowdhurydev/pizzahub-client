import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function handler(request: Request) {
  const auth = await getAuth();
  const { GET, POST } = toNextJsHandler(auth);
  if (request.method === "GET") return GET(request);
  return POST(request);
}

export { handler as GET, handler as POST };
