import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

// Better Auth requires an absolute URL. In the browser we use the current
// origin so every auth request hits this app's /api/auth proxy; the SSR
// fallback is configurable for non-browser rendering.
const authOrigin =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: `${authOrigin}/api/auth`,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [jwtClient()],
});
