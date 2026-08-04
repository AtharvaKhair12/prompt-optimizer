/**
 * /api/history — CRUD for optimization history (signed-in users only).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/history — Fetch user's optimization history.
 * Returns the 50 most recent optimizations, sorted by creation date (newest first).
 */
export async function GET() {
  if (!isMongoConfigured) {
    return NextResponse.json({ entries: [] }); // Anonymous mode — no server history
  }
  const session = await auth() as any;
  if (!session?.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const optimizations = await db
      .collection("optimizations")
      .find({ userId: (session.user as any).id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const entries = optimizations.map((doc) => ({
      id: doc._id.toString(),
      originalPrompt: doc.originalPrompt,
      optimizedPrompt: doc.optimizedPrompt,
      scores: doc.scores,
      techniquesApplied: doc.techniquesApplied,
      rationale: doc.rationale || "",
      createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json(entries);
  } catch (error) {
    console.error("[history] Failed to fetch history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/history — Delete a specific optimization entry.
 * Requires `id` in the request body. Only deletes entries belonging to the session user.
 */
export async function DELETE(request: NextRequest) {
  if (!isMongoConfigured) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
  const session = await auth() as any;
  if (!session?.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const db = getDb();
    const result = await db.collection("optimizations").deleteOne({
      _id: new ObjectId(id),
      userId: (session.user as any).id, // Ensure ownership
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[history] Failed to delete entry:", error);
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    );
  }
}
