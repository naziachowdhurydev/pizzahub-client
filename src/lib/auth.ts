import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { jwt } from "better-auth/plugins";
import { MongoClient } from "mongodb";

// This file is imported only by the /api/auth route handler, so it runs in the
// Next.js server runtime. All values below are server-only environment
// variables - none are NEXT_PUBLIC_, so no secret reaches the browser.
const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters.");
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is missing.");
}

const googleClientId = process.env.BETTER_AUTH_GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET;
if (!googleClientId || !googleClientSecret) {
  throw new Error(
    "BETTER_AUTH_GOOGLE_CLIENT_ID and BETTER_AUTH_GOOGLE_CLIENT_SECRET are required.",
  );
}

const mongoClient = new MongoClient(uri);
const mongoDB = mongoClient.db(process.env.DB_NAME || "pizzahub");

export const auth = betterAuth({
  appName: "PizzaHub",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret,
  trustedOrigins: [process.env.CLIENT_URL || "http://localhost:3000"],
  database: mongodbAdapter(mongoDB, { client: mongoClient }),
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
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
    },
  },
  plugins: [jwt()],
});
