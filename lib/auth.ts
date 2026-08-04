/**
 * Auth.js v5 configuration — Google + GitHub OAuth, JWT sessions, MongoDB adapter.
 *
 * When OAuth credentials / MongoDB URI are absent (local dev without .env.local)
 * we export stub handlers that return a clean JSON 503 response so the rest of
 * the app stays fully functional in anonymous / keyless mode.
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import client, { isMongoConfigured } from "./mongodb";

// ── Guard: skip real auth when credentials are missing ──────────────────────
const missingVars = [
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "AUTH_GITHUB_ID",
  "AUTH_GITHUB_SECRET",
].filter((key) => !process.env[key]);

const authConfigured = missingVars.length === 0 && isMongoConfigured;

if (!authConfigured) {
  const missing = [
    ...missingVars,
    ...(!isMongoConfigured ? ["MONGODB_URI"] : []),
  ];
  console.warn(
    `[auth] Missing env vars: ${missing.join(", ")}.\n` +
      "Auth features disabled. Copy .env.local.example → .env.local and fill in values."
  );
}

// Stub handler returned when credentials are missing.
// Auth.js client fetches /api/auth/session and expects a 200 with null/empty body.
// Returning 503 causes "Unexpected end of JSON input" in the client.
function stubHandler(req: NextRequest) {
  const url = new URL(req.url);
  // Return empty session for session endpoint, 503 for everything else
  if (url.pathname.endsWith("/session")) {
    return NextResponse.json(null, { status: 200 });
  }
  return NextResponse.json(
    { error: "Auth not configured. See .env.local.example." },
    { status: 503 }
  );
}

// ── Types ────────────────────────────────────────────────────────────────────
type Handler = (req: NextRequest) => Response | Promise<Response>;

let handlers: { GET: Handler; POST: Handler };
let signIn: (...args: unknown[]) => Promise<unknown>;
let signOut: (...args: unknown[]) => Promise<unknown>;
let auth: (...args: unknown[]) => Promise<unknown>;

// ── Real NextAuth setup (only when fully configured) ────────────────────────
if (authConfigured) {
  const nextAuth = NextAuth({
    adapter: MongoDBAdapter(client!),
    session: {
      strategy: "jwt",
    },
    providers: [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      }),
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID!,
        clientSecret: process.env.AUTH_GITHUB_SECRET!,
      }),
    ],
    pages: {
      signIn: "/login",
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user?.id) {
          token.userId = user.id;
        }
        return token;
      },
      async session({ session, token }) {
        if (token.userId && session.user) {
          (session.user as any).id = token.userId as string;
        }
        return session;
      },
    },
    trustHost: true,
  });

  handlers = nextAuth.handlers as { GET: Handler; POST: Handler };
  signIn = nextAuth.signIn as typeof signIn;
  signOut = nextAuth.signOut as typeof signOut;
  auth = nextAuth.auth as typeof auth;
} else {
  handlers = { GET: stubHandler, POST: stubHandler };
  signIn = async () => {
    throw new Error("Auth not configured.");
  };
  signOut = async () => {
    throw new Error("Auth not configured.");
  };
  auth = async () => null;
}

export { handlers, signIn, signOut, auth };
