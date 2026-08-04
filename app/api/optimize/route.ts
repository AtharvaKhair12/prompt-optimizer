/**
 * POST /api/optimize — Main optimization endpoint.
 *
 * Keyless-first: uses the built-in rule-based rewriter by default.
 * No API key, no external calls, no setup required.
 *
 * Optionally persists results to MongoDB for signed-in users.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rewritePrompt } from "@/lib/rewriter";
import { OptimizeRequestSchema } from "@/lib/types";
import { getDb, isMongoConfigured } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parseResult = OptimizeRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt } = parseResult.data;

    // Run the built-in rule-based rewriter — always works, no key needed
    const result = rewritePrompt(prompt);

    // If signed in and MongoDB is configured, persist to optimization history
    const session = await auth() as any;
    if (isMongoConfigured && session?.user && session.user.id) {
      try {
        const db = getDb();
        await db.collection("optimizations").insertOne({
          userId: (session.user as any).id,
          originalPrompt: prompt,
          optimizedPrompt: result.optimized_prompt,
          scores: result.scores,
          techniquesApplied: result.techniques_applied,
          rationale: result.rationale,
          createdAt: new Date(),
        });
      } catch (err) {
        // Non-fatal — don't fail the request if history save fails
        console.error("[optimize] Failed to persist optimization:", err);
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[optimize] Unexpected error:", error);
    return NextResponse.json(
      { error: "internal", message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
