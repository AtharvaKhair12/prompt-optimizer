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
import { checkRateLimit, hashPrompt, getCachedOptimization, cacheOptimization } from "@/lib/cache";

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

    // --- Rate Limiting ---
    const session = await auth() as any;
    const userId = session?.user?.id;
    // Identify by user ID if logged in, otherwise by IP
    const identifier = userId || request.ip || request.headers.get("x-forwarded-for") || "anonymous";
    
    if (isMongoConfigured) {
      const { success } = await checkRateLimit(identifier);
      if (!success) {
        return NextResponse.json(
          { error: "too_many_requests", message: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }

    // --- Caching ---
    const promptHash = await hashPrompt(prompt);
    let cached = null;
    
    if (isMongoConfigured) {
      cached = await getCachedOptimization(promptHash);
    }
    
    if (cached) {
      // If we found a cached response, return it directly to save time and LLM costs
      return NextResponse.json(cached);
    }

    // Call the LLM to rewrite the prompt dynamically
    const result = await rewritePrompt(prompt);
    
    // The LLM "hallucinates" its own scores in the JSON, which can be inconsistent with our frontend heuristic scorer.
    // To ensure scores are directly comparable (apples-to-apples) and always accurately reflect the structural improvements,
    // we recalculate the scores for the optimized prompt using our deterministic local heuristic engine.
    const { scorePrompt } = await import("@/lib/heuristics");
    const { scores: realScores } = scorePrompt(result.optimized_prompt);
    result.scores = realScores;

    if (isMongoConfigured) {
      // Cache the result for future requests
      await cacheOptimization(promptHash, result);

      // If signed in and MongoDB is configured, persist to optimization history
      if (userId) {
      try {
        const db = getDb();
        await db.collection("optimizations").insertOne({
          userId: userId,
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
