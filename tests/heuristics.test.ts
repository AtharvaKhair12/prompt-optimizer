import { describe, it, expect } from "vitest";
import { scorePrompt, overallScore } from "../lib/heuristics";

describe("heuristics.scorePrompt", () => {
  it("should score a vague one-liner low", () => {
    const result = scorePrompt("do something good");
    expect(result.scores.clarity).toBeLessThanOrEqual(7);
    expect(result.flags.length).toBeGreaterThan(0);
    expect(result.flags.some((f) => f.toLowerCase().includes("vague"))).toBe(true);
  });

  it("should score a well-structured prompt high", () => {
    const prompt = `You are a senior Python developer. Analyze the following code for security vulnerabilities, focusing on SQL injection and XSS. For each vulnerability found, provide: (1) the line number, (2) the vulnerability type, (3) severity (critical/high/medium/low), and (4) a specific fix with corrected code. You must identify at least the top 3 issues. Output your findings as a JSON array.`;
    const result = scorePrompt(prompt);
    expect(result.scores.clarity).toBeGreaterThanOrEqual(7);
    expect(result.scores.structure).toBeGreaterThanOrEqual(7);
    expect(result.scores.completeness).toBeGreaterThanOrEqual(7);
    expect(result.scores.specificity).toBeGreaterThanOrEqual(7);
    expect(result.flags.length).toBeLessThanOrEqual(2);
  });

  it("should flag missing output format", () => {
    const result = scorePrompt("You are an expert. Write me a summary of the latest trends in AI.");
    expect(result.flags.some((f) => f.toLowerCase().includes("format"))).toBe(true);
  });

  it("should flag missing role/persona", () => {
    const result = scorePrompt(
      "Analyze these financial statements and identify anomalies. Output as JSON."
    );
    expect(result.flags.some((f) => f.toLowerCase().includes("role") || f.toLowerCase().includes("persona"))).toBe(true);
  });

  it("should flag missing constraints", () => {
    const result = scorePrompt(
      "You are a chef. Write a recipe for pasta. Output as a list."
    );
    expect(result.flags.some((f) => f.toLowerCase().includes("constraint"))).toBe(true);
  });

  it("should flag very short prompts", () => {
    const result = scorePrompt("Hi");
    expect(result.flags.some((f) => f.toLowerCase().includes("short"))).toBe(true);
    expect(result.scores.clarity).toBeLessThanOrEqual(7);
  });

  it("should flag very long prompts", () => {
    const longPrompt = "word ".repeat(1000);
    const result = scorePrompt(longPrompt);
    expect(result.flags.some((f) => f.toLowerCase().includes("long"))).toBe(true);
  });

  it("should clamp all scores to 0-10", () => {
    const result = scorePrompt("x"); // Extremely short, vague
    const { scores } = result;
    expect(scores.clarity).toBeGreaterThanOrEqual(0);
    expect(scores.clarity).toBeLessThanOrEqual(10);
    expect(scores.specificity).toBeGreaterThanOrEqual(0);
    expect(scores.specificity).toBeLessThanOrEqual(10);
    expect(scores.structure).toBeGreaterThanOrEqual(0);
    expect(scores.structure).toBeLessThanOrEqual(10);
    expect(scores.completeness).toBeGreaterThanOrEqual(0);
    expect(scores.completeness).toBeLessThanOrEqual(10);
  });

  it("should handle empty string", () => {
    const result = scorePrompt("");
    expect(result.scores.clarity).toBeLessThanOrEqual(7);
    expect(result.flags.length).toBeGreaterThan(0);
  });

  it("should give bonus for structured prompts with numbered steps", () => {
    const withSteps = "You are a teacher. 1. Explain photosynthesis. 2. Provide examples. 3. Give a quiz. Output as markdown. You must cover all key concepts.";
    const withoutSteps = "You are a teacher. Explain photosynthesis, provide examples and give a quiz. Output as markdown. You must cover all key concepts.";
    const resultWith = scorePrompt(withSteps);
    const resultWithout = scorePrompt(withoutSteps);
    expect(resultWith.scores.structure).toBeGreaterThanOrEqual(resultWithout.scores.structure);
  });
});

describe("heuristics.overallScore", () => {
  it("should return a weighted average", () => {
    const result = overallScore({
      clarity: 8,
      specificity: 6,
      structure: 7,
      completeness: 9,
    });
    // 8*0.3 + 6*0.25 + 7*0.25 + 9*0.2 = 2.4 + 1.5 + 1.75 + 1.8 = 7.45
    expect(result).toBeCloseTo(7.5, 0);
  });

  it("should handle perfect scores", () => {
    const result = overallScore({ clarity: 10, specificity: 10, structure: 10, completeness: 10 });
    expect(result).toBe(10);
  });

  it("should handle zero scores", () => {
    const result = overallScore({ clarity: 0, specificity: 0, structure: 0, completeness: 0 });
    expect(result).toBe(0);
  });
});
