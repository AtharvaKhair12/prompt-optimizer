/**
 * /api/user/key — Manage encrypted API key for signed-in users.
 * Returns 503 gracefully when MongoDB is not configured.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { getDb, isMongoConfigured } from "@/lib/mongodb";

function notConfigured() {
  return NextResponse.json(
    { error: "Auth not configured. See .env.local.example." },
    { status: 503 }
  );
}

/**
 * GET /api/user/key — Check if the user has a saved API key.
 * Never returns the actual key.
 */
export async function GET() {
  if (!isMongoConfigured) return notConfigured();
  const session = await auth() as any;
  if (!session?.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const user = await db.collection("users").findOne({
      _id: (session.user as any).id,
    });

    return NextResponse.json({
      hasKey: !!user?.encryptedApiKey,
    });
  } catch (error) {
    console.error("[user/key] Failed to check key:", error);
    return NextResponse.json(
      { error: "Failed to check key status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/key — Save an encrypted API key to the user's document.
 */
export async function POST(request: NextRequest) {
  if (!isMongoConfigured) return notConfigured();
  const session = await auth() as any;
  if (!session?.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { apiKey } = await request.json();
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 400 });
    }

    const encrypted = encrypt(apiKey.trim());
    const db = getDb();

    await db.collection("users").updateOne(
      { _id: (session.user as any).id },
      { $set: { encryptedApiKey: encrypted } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[user/key] Failed to save key:", error);
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/key — Remove the saved API key from the user's document.
 */
export async function DELETE() {
  if (!isMongoConfigured) return notConfigured();
  const session = await auth() as any;
  if (!session?.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    await db.collection("users").updateOne(
      { _id: (session.user as any).id },
      { $unset: { encryptedApiKey: "" } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[user/key] Failed to remove key:", error);
    return NextResponse.json(
      { error: "Failed to remove API key" },
      { status: 500 }
    );
  }
}
