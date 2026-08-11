import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import client, { isMongoConfigured } from "./mongodb";
import bcrypt from "bcryptjs";

// ── Guard: skip real auth when credentials are missing ──────────────────────
const missingVars = ["AUTH_SECRET", "MONGODB_URI"].filter((key) => !process.env[key]);
const authConfigured = missingVars.length === 0 && isMongoConfigured;

if (!authConfigured) {
  console.warn(
    `[auth] Missing env vars: ${missingVars.join(", ")}.\n` +
      "Auth features disabled. Copy .env.local.example → .env.local and fill in values."
  );
}

function stubHandler(req: NextRequest) {
  const url = new URL(req.url);
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

// ── Real NextAuth setup ─────────────────────────────────────────────────────
if (authConfigured) {
  const nextAuth = NextAuth({
    adapter: MongoDBAdapter(client!),
    session: {
      strategy: "jwt",
    },
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email", placeholder: "you@example.com" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const mongoClient = await client;
          if (!mongoClient) return null;
          const db = mongoClient.db();
          const user = await db.collection("users").findOne({ email: credentials.email });

          if (!user || !user.password) {
            return null;
          }

          const passwordsMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (passwordsMatch) {
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
            };
          }

          return null;
        }
      })
    ],
    pages: {
      signIn: "/login",
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
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
