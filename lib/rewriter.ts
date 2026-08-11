import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import type { OptimizationResult } from './types';

const SYSTEM_PROMPT = `You are an elite Prompt Engineer and AI Optimizer.
Your job is to take a user's raw prompt and rewrite it to be highly effective, precise, and structured for an LLM to understand.

When rewriting a prompt, apply the following techniques:
1. Assign an expert persona/role if appropriate.
2. Structure the prompt clearly using markdown (e.g. Context, Task, Constraints, Output Format).
3. Add specific constraints to prevent generic or vague outputs.
4. Replace vague language with precise terminology.
5. If the prompt is complex, add a chain-of-thought directive (e.g., "Think step-by-step").

You MUST return your response as a raw JSON object and nothing else. Do not use markdown blocks around the JSON. The JSON must exactly match this structure:
{
  "optimized_prompt": "The final rewritten prompt",
  "scores": { "clarity": 9, "specificity": 8, "structure": 9, "completeness": 8 },
  "techniques_applied": ["Expert Persona", "Structured Formatting"],
  "rationale": "Why this is better"
}
Note: All scores must be numbers between 0 and 10. IMPORTANT: You must properly escape all newlines as \\n in your JSON string values.`;

export async function rewritePrompt(prompt: string): Promise<OptimizationResult> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const result = await generateText({
    model: groq('llama-3.3-70b-versatile'),
    system: SYSTEM_PROMPT,
    prompt: `Original Prompt:\n${prompt}\n\nPlease rewrite this prompt to be significantly better. Reply ONLY with the valid JSON object.`,
  });

  try {
    const rawText = result.text.trim();
    const startIndex = rawText.indexOf('{');
    const endIndex = rawText.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("No JSON object found in response");
    }
    
    let jsonString = rawText.substring(startIndex, endIndex + 1);
    
    // Sanitization for common LLM JSON errors:
    // 1. Remove illegal single quote escapes (\') which throw SyntaxError in JSON.parse
    jsonString = jsonString.replace(/\\'/g, "'");
    
    // 2. Collapse structural and literal newlines into spaces.
    // This safely eliminates any literal newlines inside strings without affecting 
    // proper escaped newlines (\n) or breaking the JSON structure.
    jsonString = jsonString.replace(/\n/g, " ").replace(/\r/g, "");
    
    const parsed = JSON.parse(jsonString);
    return {
      optimized_prompt: parsed.optimized_prompt,
      scores: parsed.scores,
      techniques_applied: parsed.techniques_applied,
      rationale: parsed.rationale,
    };
  } catch (err) {
    console.error("Failed to parse JSON from Groq:", result.text);
    throw new Error("AI returned invalid format");
  }
}
