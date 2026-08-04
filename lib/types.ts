import { z } from "zod";

// ─── Zod Schemas ───────────────────────────────────────────────────────────────

export const ScoresSchema = z.object({
  clarity: z.number().min(0).max(10),
  specificity: z.number().min(0).max(10),
  structure: z.number().min(0).max(10),
  completeness: z.number().min(0).max(10),
});

export const OptimizationResultSchema = z.object({
  optimized_prompt: z.string(),
  scores: ScoresSchema,
  techniques_applied: z.array(z.string()),
  rationale: z.string(),
});

export const OptimizeRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(10000),
  apiKey: z.string().optional(),
  model: z.string().optional(),
});

// ─── TypeScript Types ──────────────────────────────────────────────────────────

export type Scores = z.infer<typeof ScoresSchema>;
export type OptimizationResult = z.infer<typeof OptimizationResultSchema>;
export type OptimizeRequest = z.infer<typeof OptimizeRequestSchema>;

export interface HeuristicResult {
  scores: Scores;
  flags: string[];
}

export interface EmbeddingResult {
  clarity: number;
  specificity: number;
  avgSimilarity: number;
}

export interface OptimizationEntry {
  id: string;
  originalPrompt: string;
  optimizedPrompt: string;
  scores: Scores;
  techniquesApplied: string[];
  rationale: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}
