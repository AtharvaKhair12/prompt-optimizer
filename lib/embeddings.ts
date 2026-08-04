/**
 * Embedding-based prompt scorer — runs entirely in-browser via @xenova/transformers (WASM).
 * Computes cosine similarity of the user's prompt against curated exemplar prompts
 * to produce clarity and specificity sub-scores.
 */

import type { EmbeddingResult } from "./types";

// Lazy-loaded pipeline singleton
let pipelineInstance: any = null;
let exemplarEmbeddings: Float32Array[] | null = null;

// Import exemplars statically (they're small JSON, tree-shaken fine)
import exemplars from "./exemplars.json";

/**
 * Lazily initialize the feature-extraction pipeline.
 * The model (~30MB) downloads and caches in the browser on first call.
 */
async function getPipeline() {
  if (pipelineInstance) return pipelineInstance;

  const { pipeline } = await import("@xenova/transformers");
  pipelineInstance = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
    // Use WASM backend (runs on any browser, no WebGPU required)
    device: "wasm",
  } as any);
  return pipelineInstance;
}

/**
 * Generate a normalized embedding vector for a given text.
 */
async function embed(text: string): Promise<Float32Array> {
  const pipe = await getPipeline();
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return output.data as Float32Array;
}

/**
 * Pre-compute embeddings for all exemplar prompts (cached after first call).
 */
async function getExemplarEmbeddings(): Promise<Float32Array[]> {
  if (exemplarEmbeddings) return exemplarEmbeddings;

  const embeddings = await Promise.all(
    exemplars.map((ex: { text: string }) => embed(ex.text))
  );
  exemplarEmbeddings = embeddings;
  return embeddings;
}

/**
 * Cosine similarity between two normalized vectors (dot product).
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * Score a prompt by comparing its embedding against the exemplar corpus.
 *
 * - `clarity`: scaled from average similarity to the top-3 most similar exemplars (0–10)
 * - `specificity`: scaled from max similarity to any single exemplar (0–10)
 * - `avgSimilarity`: raw average cosine similarity across all exemplars
 *
 * Heuristic: well-structured prompts tend to be more similar to our curated exemplars.
 * The scaling maps typical similarity ranges (0.3–0.8) to the 0–10 score range.
 */
export async function scorePrompt(text: string): Promise<EmbeddingResult> {
  const promptEmb = await embed(text);
  const exemplarEmbs = await getExemplarEmbeddings();

  const similarities = exemplarEmbs.map((exEmb) => cosineSimilarity(promptEmb, exEmb));

  // Sort descending
  const sorted = [...similarities].sort((a, b) => b - a);
  const top3Avg = sorted.slice(0, 3).reduce((sum, v) => sum + v, 0) / 3;
  const maxSim = sorted[0];
  const avgSim = similarities.reduce((sum, v) => sum + v, 0) / similarities.length;

  // Scale similarities from [0.3, 0.75] → [0, 10]
  // Values below 0.3 → 0, above 0.75 → 10
  const scale = (value: number, low = 0.3, high = 0.75): number => {
    const normalized = (value - low) / (high - low);
    return Math.max(0, Math.min(10, Math.round(normalized * 100) / 10));
  };

  return {
    clarity: scale(top3Avg, 0.25, 0.7),
    specificity: scale(maxSim, 0.3, 0.8),
    avgSimilarity: Math.round(avgSim * 1000) / 1000,
  };
}

/**
 * Check if the embedding model is ready (loaded and cached).
 */
export function isModelReady(): boolean {
  return pipelineInstance !== null;
}

/**
 * Preload the model without scoring — call early so the model is warm
 * when the user first clicks "Optimize".
 */
export async function preloadModel(): Promise<void> {
  await getPipeline();
  await getExemplarEmbeddings();
}
