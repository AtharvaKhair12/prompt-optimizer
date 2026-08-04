/**
 * Gemini API integration — server-side only.
 * Uses structured output mode with Zod validation for type-safe responses.
 */

import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";
import { OptimizationResultSchema, type OptimizationResult } from "./types";

// ─── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a prompt engineering expert. Rewrite the user's prompt to be clearer,
more specific, and better structured for an LLM, applying this rubric where
relevant: (1) explicit role/persona, (2) sufficient context, (3) an
unambiguous task and constraints, (4) a specified output format, (5)
examples if they would help, (6) a reasoning trigger for multi-step tasks.
Preserve the user's original intent exactly — do not add new requirements.
Return ONLY valid JSON matching this schema:
{
  "optimized_prompt": string,
  "scores": { "clarity": 0-10, "specificity": 0-10, "structure": 0-10, "completeness": 0-10 },
  "techniques_applied": string[],
  "rationale": string (max 3 sentences)
}`;

// ─── JSON Schema for structured output ─────────────────────────────────────────

const RESPONSE_SCHEMA = {
  type: "object" as const,
  properties: {
    optimized_prompt: { type: "string" as const, description: "The rewritten, optimized prompt" },
    scores: {
      type: "object" as const,
      properties: {
        clarity: { type: "number" as const, description: "Clarity score 0-10" },
        specificity: { type: "number" as const, description: "Specificity score 0-10" },
        structure: { type: "number" as const, description: "Structure score 0-10" },
        completeness: { type: "number" as const, description: "Completeness score 0-10" },
      },
      required: ["clarity", "specificity", "structure", "completeness"],
    },
    techniques_applied: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "List of prompt engineering techniques applied",
    },
    rationale: { type: "string" as const, description: "Brief rationale for changes (max 3 sentences)" },
  },
  required: ["optimized_prompt", "scores", "techniques_applied", "rationale"],
};

// ─── Backoff Configuration ─────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main Function ─────────────────────────────────────────────────────────────

export type GeminiModel = "gemini-2.5-flash-lite" | "gemini-2.5-flash";

/**
 * Optimize a prompt using the Gemini API.
 *
 * @param prompt - The raw user prompt to optimize
 * @param apiKey - User's Gemini API key
 * @param model - Which Gemini model to use (default: gemini-2.5-flash-lite)
 * @returns Validated OptimizationResult
 * @throws Error on persistent rate limiting or API failure
 */
export async function optimizePrompt(
  prompt: string,
  apiKey: string,
  model: GeminiModel = "gemini-2.5-flash-lite"
): Promise<OptimizationResult> {
  const genAI = new GoogleGenerativeAI(apiKey);

  const generationConfig: GenerationConfig = {
    responseMimeType: "application/json",
    responseSchema: RESPONSE_SCHEMA as any,
    temperature: 0.7,
    maxOutputTokens: 4096,
  };

  const generativeModel = genAI.getGenerativeModel({
    model,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig,
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await generativeModel.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse and validate with Zod
      const parsed = JSON.parse(text);
      const validated = OptimizationResultSchema.parse(parsed);

      return validated;
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit error (HTTP 429)
      const isRateLimit =
        error?.status === 429 ||
        error?.message?.includes("429") ||
        error?.message?.toLowerCase().includes("rate limit") ||
        error?.message?.toLowerCase().includes("quota");

      if (isRateLimit && attempt < MAX_RETRIES) {
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        console.warn(
          `[gemini] Rate limited (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${backoffMs}ms...`
        );
        await sleep(backoffMs);
        continue;
      }

      // If it's the default model and we get a non-rate-limit error,
      // try the fallback model on the first failure
      if (model === "gemini-2.5-flash-lite" && attempt === 0 && !isRateLimit) {
        console.warn("[gemini] Primary model failed, trying fallback (gemini-2.5-flash)...");
        return optimizePrompt(prompt, apiKey, "gemini-2.5-flash");
      }

      // If rate limit exhausted all retries, throw a specific error
      if (isRateLimit) {
        const nextBackoff = INITIAL_BACKOFF_MS * Math.pow(2, MAX_RETRIES);
        throw new RateLimitError(
          `Rate limit reached. Please retry in ${Math.ceil(nextBackoff / 1000)} seconds.`,
          Math.ceil(nextBackoff / 1000)
        );
      }

      throw error;
    }
  }

  throw lastError || new Error("Optimization failed after all retries");
}

// ─── Custom Error Class ────────────────────────────────────────────────────────

export class RateLimitError extends Error {
  public retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
