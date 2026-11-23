import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { getMongoDb, getMongoClientPromise } from "./mongodb";

function normalize(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed || null;
}

function isLocalhost(value: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(value);
}

function getBaseUrl(): string {
  const configured =
    normalize(process.env.BETTER_AUTH_URL) ||
    normalize(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalize(process.env.CLIENT_URL);
  if (process.env.VERCEL) {
    if (configured && !isLocalhost(configured)) return configured;
    const deployment =
      normalize(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
      normalize(process.env.VERCEL_URL);
    if (deployment) return `https://${deployment}`;
  }
  return configured || "http://localhost:3000";
}

const googleClientId =
  process.env.GOOGLE_CLIENT_ID?.trim() ||
  process.env.BETTER_AUTH_GOOGLE_CLIENT_ID?.trim();
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET?.trim() ||
  process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET?.trim();

export const googleAuthEnabled = Boolean(googleClientId && googleClientSecret);

type AuthInstance = ReturnType<typeof betterAuth>;
let authInstance: AuthInstance | null = null;

export async function getAuth(): Promise<AuthInstance> {
  if (authInstance) return authInstance;

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters.");
  }

  const baseURL = getBaseUrl();
  const trustedOrigins = [
    baseURL,
    process.env.CLIENT_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    ...(process.env.VERCEL ? [] : ["http://localhost:3000", "http://localhost:5000"]),
  ]
    .map((origin) => normalize(origin ?? undefined))
    .filter((origin): origin is string => Boolean(origin));

  const mongoClient = await getMongoClientPromise();
  const mongoDB = await getMongoDb();

  authInstance = betterAuth({
    appName: "PizzaHub",
    baseURL,
    secret,
    trustedOrigins: Array.from(new Set(trustedOrigins)),
    database: mongodbAdapter(mongoDB, { client: mongoClient }),
    ...(googleAuthEnabled
      ? {
          socialProviders: {
            google: {
              clientId: googleClientId!,
              clientSecret: googleClientSecret!,
            },
          },
        }
      : {}),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const isVendor = user.role === "vendor";
            const now = new Date();
            return {
              data: {
                role: isVendor ? "vendor" : "customer",
                status: "active",
                plan: "free",
                vendorStatus: isVendor ? "approved" : "not_applied",
                ...(isVendor ? { vendorAppliedAt: now, vendorApprovedAt: now } : {}),
              },
            };
          },
          after: async (user) => {
            if (user.role !== "vendor") return;
            const store = await mongoDB.collection("stores").findOne({ ownerId: user.id });
            if (store) return;
            const now = new Date();
            await mongoDB.collection("stores").updateOne(
              { ownerId: user.id },
              {
                $setOnInsert: {
                  ownerId: user.id,
                  storeName: `${user.name}'s Pizza Shop`,
                  description: "",
                  phone: "",
                  address: "",
                  createdAt: now,
                },
                $set: { updatedAt: now },
              },
              { upsert: true },
            );
          },
        },
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "customer",
          input: true,
          transform: {
            input: (value) => (value === "vendor" ? "vendor" : "customer"),
          },
        },
        vendorStatus: {
          type: "string",
          required: false,
          defaultValue: "not_applied",
          input: false,
        },
        vendorAppliedAt: {
          type: "date",
          required: false,
          input: false,
        },
        vendorApprovedAt: {
          type: "date",
          required: false,
          input: false,
        },
        status: {
          type: "string",
          required: false,
          defaultValue: "active",
          input: false,
        },
        plan: {
          type: "string",
          required: false,
          defaultValue: "free",
          input: false,
        },
      },
    },
    plugins: [jwt(), nextCookies()],
  }) as unknown as AuthInstance;

  return authInstance;
}
