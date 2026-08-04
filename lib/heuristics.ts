/**
 * Heuristic prompt scorer — pure functions, zero dependencies, runs client-side.
 * Analyzes a raw prompt for common weaknesses and returns sub-scores 0–10.
 */

import type { HeuristicResult, Scores } from "./types";

// ─── Pattern Definitions ───────────────────────────────────────────────────────

const VAGUE_WORDS = /\b(something|stuff|things?|etc\.?|good|nice|great|cool|interesting|whatever|somehow|kinda|sort\s*of|a\s*lot|very|really|basically|just)\b/gi;

const OUTPUT_FORMAT_KEYWORDS = /\b(json|csv|xml|html|markdown|md|list|table|bullet|numbered|format|schema|yaml|toml|structured|template|code\s*block)\b/i;

const ROLE_PATTERNS = /\b(you\s+are|act\s+as|as\s+a|role|persona|imagine\s+you|pretend|you're\s+a|behave\s+as|take\s+the\s+role)\b/i;

const CONSTRAINT_PATTERNS = /\b(must|should|do\s+not|don't|cannot|at\s+most|at\s+least|no\s+more\s+than|maximum|minimum|limit|restrict|between|within|exactly|only|never|always|ensure|require)\b/i;

const EXAMPLE_PATTERNS = /\b(for\s+example|e\.?g\.?|such\s+as|like\s+this|here'?s?\s+an?\s+example|sample|instance|illustration|demo|consider)\b|```/i;

const TASK_VERBS = /\b(write|create|generate|explain|analyze|summarize|translate|compare|evaluate|describe|list|design|implement|build|refactor|debug|review|optimize|convert|extract|classify|recommend|suggest|outline|draft|compose|rewrite|improve|fix|identify|calculate|define|elaborate|develop|plan|propose|solve|assess|verify|validate)\b/i;

const NUMBERED_STEPS = /(?:\d+[.)]\s|\bstep\s+\d|\bfirst\b.*\bthen\b|\b(?:first|second|third|next|finally)\b)/i;

// ─── Scoring Function ──────────────────────────────────────────────────────────

export function scorePrompt(prompt: string): HeuristicResult {
  const flags: string[] = [];
  const scores: Scores = {
    clarity: 10,
    specificity: 10,
    structure: 10,
    completeness: 10,
  };

  const trimmed = prompt.trim();

  // ── Length check ──────────────────────────────────────────────────────────
  if (trimmed.length < 20) {
    flags.push("Prompt is very short — add more context and detail");
    scores.clarity -= 3;
    scores.completeness -= 3;
  } else if (trimmed.length < 50) {
    flags.push("Prompt is quite short — consider adding more specifics");
    scores.clarity -= 1;
    scores.completeness -= 1;
  }

  if (trimmed.length > 4000) {
    flags.push("Prompt is very long — consider breaking it into focused sub-prompts");
    scores.clarity -= 3;
    scores.structure -= 2;
  }

  // ── Vague phrasing ────────────────────────────────────────────────────────
  const vagueMatches = trimmed.match(VAGUE_WORDS);
  if (vagueMatches) {
    const uniqueVague = [...new Set(vagueMatches.map((m) => m.toLowerCase()))];
    const penalty = Math.min(uniqueVague.length * 1.5, 5);
    scores.clarity -= penalty;
    flags.push(
      `Vague phrasing detected: "${uniqueVague.slice(0, 3).join('", "')}"${uniqueVague.length > 3 ? ` (+${uniqueVague.length - 3} more)` : ""} — replace with precise terms`
    );
  }

  // ── Missing output format ─────────────────────────────────────────────────
  if (!OUTPUT_FORMAT_KEYWORDS.test(trimmed)) {
    flags.push("No output format specified — tell the LLM what format you want (JSON, list, table, etc.)");
    scores.structure -= 3;
  }

  // ── Missing role/context ──────────────────────────────────────────────────
  if (!ROLE_PATTERNS.test(trimmed)) {
    flags.push("No role or persona assigned — e.g., 'You are a senior data analyst…'");
    scores.completeness -= 2;
  }

  // ── Missing constraints ───────────────────────────────────────────────────
  if (!CONSTRAINT_PATTERNS.test(trimmed)) {
    flags.push("No constraints or boundaries — add limits, requirements, or restrictions");
    scores.specificity -= 2;
  }

  // ── Missing examples ──────────────────────────────────────────────────────
  if (!EXAMPLE_PATTERNS.test(trimmed)) {
    flags.push("No examples provided — add an example to clarify your expectations");
    scores.completeness -= 1;
  }

  // ── Missing task verb ─────────────────────────────────────────────────────
  if (!TASK_VERBS.test(trimmed)) {
    flags.push("No clear action verb — start with a directive like 'Write…', 'Analyze…', 'Explain…'");
    scores.structure -= 2;
    scores.clarity -= 1;
  }

  // ── Structure bonus: has numbered steps or clear sections ─────────────────
  if (NUMBERED_STEPS.test(trimmed)) {
    scores.structure = Math.min(scores.structure + 1, 10);
  }

  // ── Multi-sentence bonus ──────────────────────────────────────────────────
  const sentenceCount = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 10).length;
  if (sentenceCount >= 3) {
    scores.completeness = Math.min(scores.completeness + 1, 10);
  }

  // ── Clamp all scores to [0, 10] ──────────────────────────────────────────
  (Object.keys(scores) as (keyof Scores)[]).forEach((key) => {
    scores[key] = Math.max(0, Math.min(10, Math.round(scores[key] * 10) / 10));
  });

  return { scores, flags };
}

/**
 * Compute an overall score from individual sub-scores (0–10).
 * Uses weighted average: clarity 30%, specificity 25%, structure 25%, completeness 20%.
 */
export function overallScore(scores: Scores): number {
  const weighted =
    scores.clarity * 0.3 +
    scores.specificity * 0.25 +
    scores.structure * 0.25 +
    scores.completeness * 0.2;
  return Math.round(weighted * 10) / 10;
}
