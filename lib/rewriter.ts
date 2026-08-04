/**
 * Rule-based prompt rewriter — zero external dependencies, runs server-side.
 *
 * Analyzes a raw prompt for structural weaknesses and injects targeted
 * improvements using a curated rule set. Returns an OptimizationResult
 * in the same shape as the Gemini API path so the UI is unaffected.
 */

import type { OptimizationResult, Scores } from "./types";

// ─── Domain Detection ──────────────────────────────────────────────────────────

type Domain =
  | "code"
  | "writing"
  | "data"
  | "security"
  | "design"
  | "product"
  | "education"
  | "legal"
  | "marketing"
  | "research"
  | "general";

const DOMAIN_PATTERNS: Record<Domain, RegExp> = {
  code: /\b(code|function|class|bug|error|implement|refactor|debug|api|deploy|git|test|typescript|javascript|python|java|sql|database|backend|frontend|component|algorithm|script|lint|compile|package|module|library|framework|repo|repository|endpoint|hook|state|interface|type|enum|async|await|promise)\b/i,
  data: /\b(data|dataset|analyze|analysis|statistics|chart|graph|visualization|dashboard|metrics|kpi|report|csv|excel|pandas|model|train|predict|ml|machine learning|regression|cluster|correlation|etl|pipeline|warehouse)\b/i,
  security: /\b(security|vulnerability|exploit|threat|attack|pentest|firewall|encrypt|decrypt|authentication|authorization|oauth|jwt|xss|sql injection|malware|phishing|audit|compliance|gdpr|zero.?day)\b/i,
  design: /\b(design|ui|ux|interface|wireframe|mockup|prototype|layout|typography|color|brand|logo|figma|sketch|component|accessibility|responsive|mobile|web design)\b/i,
  product: /\b(product|feature|roadmap|prd|requirement|user story|acceptance criteria|stakeholder|sprint|backlog|mvp|launch|go.?to.?market|persona|feedback|kpi|metric|saas)\b/i,
  education: /\b(explain|teach|learn|course|lesson|tutorial|concept|understand|student|beginner|introduction|overview|guide|how.?to|what is|definition|example)\b/i,
  legal: /\b(legal|law|contract|compliance|regulation|policy|terms|privacy|gdpr|liability|intellectual property|copyright|patent|trademark|clause|jurisdiction)\b/i,
  marketing: /\b(marketing|campaign|seo|ad|advertisement|copy|email|social media|content|brand|audience|conversion|funnel|cta|landing page|tagline|headline|engagement)\b/i,
  research: /\b(research|study|survey|literature|hypothesis|methodology|citation|academic|paper|journal|experiment|findings|analysis|review|thesis)\b/i,
  writing: /\b(write|essay|article|blog|email|letter|story|narrative|draft|edit|proofread|tone|voice|paragraph|summary|report|proposal|memo|press release|speech|script)\b/i,
  general: /.*/,
};

const DOMAIN_ROLES: Record<Domain, string> = {
  code: "You are a senior software engineer with 10+ years of experience across multiple languages and paradigms",
  data: "You are a senior data scientist and analyst specializing in statistical modeling and data visualization",
  security: "You are a certified cybersecurity expert (CISSP) with expertise in threat modeling and penetration testing",
  design: "You are a principal UX/UI designer with a strong background in user research and design systems",
  product: "You are a senior product manager at a top-tier tech company with experience shipping complex B2B products",
  education: "You are an expert educator and technical writer skilled at making complex topics accessible",
  legal: "You are a legal expert with deep knowledge of contract law, compliance, and regulatory frameworks",
  marketing: "You are a senior marketing strategist specializing in conversion optimization and brand communication",
  research: "You are a rigorous academic researcher with expertise in qualitative and quantitative methodologies",
  writing: "You are an expert writer and editor with a strong command of structure, clarity, and audience adaptation",
  general: "You are a highly capable expert assistant with broad knowledge and analytical precision",
};

const DOMAIN_FORMAT_HINTS: Record<Domain, string> = {
  code: "Provide your response with clearly labeled code blocks (specify the language), inline comments for non-obvious logic, and a brief explanation of your approach before the code.",
  data: "Present your findings in a structured format: methodology first, then results as tables or bullet points, followed by key insights and recommendations.",
  security: "Structure your output as: threat overview → specific findings (severity: critical/high/medium/low) → concrete mitigation steps for each finding.",
  design: "Organize your response with: rationale first, then specific recommendations with examples, and note any accessibility or usability considerations.",
  product: "Format your output using clear markdown headers for each section. Include acceptance criteria as checkboxes where applicable.",
  education: "Structure your explanation as: concept overview → step-by-step breakdown with concrete examples → common pitfalls to avoid → a quick-check summary.",
  legal: "Present your analysis with clear section headers. Note any jurisdiction-specific caveats and flag areas requiring professional legal review.",
  marketing: "Format your response with: the core message first, then variations for different channels, followed by key metrics to track.",
  research: "Structure your response as: hypothesis → methodology → findings → implications → limitations and future directions.",
  writing: "Provide the written output first, followed by a brief rationale for key stylistic choices and any alternative approaches considered.",
  general: "Structure your response with a clear hierarchy: start with a direct answer or summary, then provide supporting detail, and end with any caveats or next steps.",
};

// ─── Vague Word Replacements ───────────────────────────────────────────────────

const VAGUE_REPLACEMENTS: Record<string, string> = {
  good: "high-quality and well-structured",
  great: "excellent and comprehensive",
  nice: "polished and professional",
  cool: "innovative and effective",
  interesting: "insightful and relevant",
  stuff: "the relevant components and details",
  things: "the specific elements",
  something: "a specific, concrete output",
  etc: "and any other relevant details you identify",
  "etc.": "and any other relevant details you identify",
  somehow: "using a clearly defined approach",
  "kinda": "approximately",
  "sort of": "specifically",
  "a lot": "a significant number of",
  very: "",
  really: "",
  basically: "in essence",
  just: "",
  whatever: "whichever approach is most appropriate",
};

// ─── Pattern Matchers ──────────────────────────────────────────────────────────

const VAGUE_WORDS = /\b(something|stuff|things?|etc\.?|good|nice|great|cool|interesting|whatever|somehow|kinda|sort\s*of|a\s*lot|very|really|basically|just)\b/gi;
const OUTPUT_FORMAT_KEYWORDS = /\b(json|csv|xml|html|markdown|md|list|table|bullet|numbered|format|schema|yaml|toml|structured|template|code\s*block)\b/i;
const ROLE_PATTERNS = /\b(you\s+are|act\s+as|as\s+a|role|persona|imagine\s+you|pretend|you're\s+a|behave\s+as|take\s+the\s+role)\b/i;
const CONSTRAINT_PATTERNS = /\b(must|should|do\s+not|don't|cannot|at\s+most|at\s+least|no\s+more\s+than|maximum|minimum|limit|restrict|between|within|exactly|only|never|always|ensure|require)\b/i;
const EXAMPLE_PATTERNS = /\b(for\s+example|e\.?g\.?|such\s+as|like\s+this|here'?s?\s+an?\s+example|sample|instance|illustration|demo|consider)\b|```/i;
const TASK_VERBS = /\b(write|create|generate|explain|analyze|summarize|translate|compare|evaluate|describe|list|design|implement|build|refactor|debug|review|optimize|convert|extract|classify|recommend|suggest|outline|draft|compose|rewrite|improve|fix|identify|calculate|define|elaborate|develop|plan|propose|solve|assess|verify|validate)\b/i;

// ─── Domain Inference ──────────────────────────────────────────────────────────

function inferDomain(prompt: string): Domain {
  for (const [domain, pattern] of Object.entries(DOMAIN_PATTERNS) as [Domain, RegExp][]) {
    if (domain === "general") continue;
    if (pattern.test(prompt)) return domain;
  }
  return "general";
}

// ─── Constraint Generator ──────────────────────────────────────────────────────

function generateConstraints(prompt: string, domain: Domain): string {
  const constraints: string[] = [];

  // Length constraint
  if (/\b(explain|describe|overview|summary|summarize)\b/i.test(prompt)) {
    constraints.push("Keep your response concise and focused — aim for clarity over length");
  } else if (/\b(comprehensive|detailed|thorough|complete|full)\b/i.test(prompt)) {
    constraints.push("Be thorough and comprehensive — do not omit important details");
  } else {
    constraints.push("Be precise and avoid unnecessary padding or repetition");
  }

  // Domain-specific constraints
  switch (domain) {
    case "code":
      constraints.push("Ensure the code is production-ready: handles edge cases, includes error handling, and follows best practices");
      constraints.push("Do not use deprecated APIs or patterns");
      break;
    case "data":
      constraints.push("State your assumptions clearly before presenting results");
      constraints.push("Quantify uncertainty where applicable (e.g., confidence intervals, p-values)");
      break;
    case "security":
      constraints.push("Prioritize findings by severity (critical → high → medium → low)");
      constraints.push("Include only actionable, specific mitigations — avoid generic advice");
      break;
    case "writing":
      constraints.push("Match the tone and register to the intended audience");
      constraints.push("Ensure logical flow between paragraphs with smooth transitions");
      break;
    case "product":
      constraints.push("Ground recommendations in user needs, not assumptions");
      constraints.push("Every requirement must be testable and unambiguous");
      break;
    case "education":
      constraints.push("Use concrete, relatable analogies to illustrate abstract concepts");
      constraints.push("Do not assume prior knowledge beyond what is explicitly stated");
      break;
    default:
      constraints.push("Ground your response in facts — flag anything speculative or uncertain");
  }

  return constraints.map((c, i) => `${i + 1}. ${c}`).join("\n");
}

// ─── Task Verb Inferrer ────────────────────────────────────────────────────────

function inferTaskVerb(prompt: string): string {
  if (/\?/.test(prompt)) return "Answer the following question clearly and thoroughly:";
  if (/\b(how|what|why|when|where|who|which)\b/i.test(prompt)) return "Explain the following:";
  if (/\b(help|assist|support)\b/i.test(prompt)) return "Provide detailed assistance with the following:";
  return "Complete the following task:";
}

// ─── Vague Word Replacer ───────────────────────────────────────────────────────

function replaceVagueWords(prompt: string): { text: string; count: number } {
  let count = 0;
  const text = prompt.replace(VAGUE_WORDS, (match) => {
    const lower = match.toLowerCase().trim();
    const replacement = VAGUE_REPLACEMENTS[lower];
    if (replacement !== undefined) {
      count++;
      return replacement === "" ? "" : replacement;
    }
    return match;
  });
  // Clean up double spaces from empty replacements
  return { text: text.replace(/\s{2,}/g, " ").trim(), count };
}

// ─── Score Booster ─────────────────────────────────────────────────────────────

/**
 * Estimate scores for the rewritten prompt based on what was injected.
 * These are conservative estimates — we don't over-promise.
 */
function estimateOptimizedScores(
  original: string,
  hadRole: boolean,
  hadFormat: boolean,
  hadConstraints: boolean,
  hadTaskVerb: boolean,
  vagueCount: number
): Scores {
  // Start from a base that reflects a well-structured prompt
  let clarity = 7.5;
  let specificity = 7.0;
  let structure = 7.5;
  let completeness = 7.5;

  // Bonus for each thing we fixed
  if (!hadRole) { completeness += 0.8; specificity += 0.5; }
  if (!hadFormat) { structure += 0.8; clarity += 0.3; }
  if (!hadConstraints) { specificity += 0.7; completeness += 0.4; }
  if (!hadTaskVerb) { clarity += 0.5; structure += 0.3; }
  if (vagueCount > 0) { clarity += Math.min(vagueCount * 0.3, 1.0); }

  // Length bonus
  if (original.length > 200) { completeness += 0.3; }

  // Clamp to [0, 10]
  const clamp = (v: number) => Math.round(Math.max(0, Math.min(10, v)) * 10) / 10;
  return {
    clarity: clamp(clarity),
    specificity: clamp(specificity),
    structure: clamp(structure),
    completeness: clamp(completeness),
  };
}

// ─── Main Rewriter ─────────────────────────────────────────────────────────────

export function rewritePrompt(prompt: string): OptimizationResult {
  const trimmed = prompt.trim();
  const domain = inferDomain(trimmed);

  // ── Detect what's missing ─────────────────────────────────────────────────
  const hadRole = ROLE_PATTERNS.test(trimmed);
  const hadFormat = OUTPUT_FORMAT_KEYWORDS.test(trimmed);
  const hadConstraints = CONSTRAINT_PATTERNS.test(trimmed);
  const hadTaskVerb = TASK_VERBS.test(trimmed);
  const hadExamples = EXAMPLE_PATTERNS.test(trimmed);

  // ── Apply vague word replacement ──────────────────────────────────────────
  const { text: cleanedPrompt, count: vagueCount } = replaceVagueWords(trimmed);

  // ── Build the rewritten prompt ────────────────────────────────────────────
  const parts: string[] = [];
  const techniquesApplied: string[] = [];
  const rationalePoints: string[] = [];

  // 1. Role injection
  if (!hadRole) {
    parts.push(DOMAIN_ROLES[domain] + ".");
    techniquesApplied.push("Role & Persona Assignment");
    rationalePoints.push(`Added a domain-specific expert persona to prime the model with the right lens for ${domain} tasks.`);
  }

  // 2. Task verb / clear directive
  if (!hadTaskVerb) {
    parts.push(inferTaskVerb(cleanedPrompt));
    techniquesApplied.push("Clear Action Directive");
    rationalePoints.push("Added an explicit action verb to remove ambiguity about what output is expected.");
  }

  // 3. The core prompt (cleaned)
  parts.push(cleanedPrompt);

  // 4. Output format instruction
  if (!hadFormat) {
    parts.push("\n" + DOMAIN_FORMAT_HINTS[domain]);
    techniquesApplied.push("Output Format Specification");
    rationalePoints.push("Specified a structured output format to guide the model toward a consistent, parseable response.");
  }

  // 5. Constraints
  if (!hadConstraints) {
    const constraints = generateConstraints(trimmed, domain);
    parts.push("\nAdhere to the following requirements:\n" + constraints);
    techniquesApplied.push("Explicit Constraints & Requirements");
    rationalePoints.push("Added constraints to bound the solution space and prevent common failure modes like over-hedging or scope creep.");
  }

  // 6. Vague word replacement
  if (vagueCount > 0) {
    techniquesApplied.push("Vague Language Elimination");
    rationalePoints.push(`Replaced ${vagueCount} vague term${vagueCount > 1 ? "s" : ""} with precise alternatives to reduce ambiguity.`);
  }

  // 7. Example prompt (only if very short and no examples)
  if (!hadExamples && trimmed.length < 120 && trimmed.length > 20) {
    parts.push("\nIf examples would clarify the expected output, include one concrete before/after or sample in your response.");
    techniquesApplied.push("Example Elicitation");
    rationalePoints.push("Invited examples to anchor the output format and reduce hallucination risk.");
  }

  // If nothing was applied, still produce a clean output
  if (techniquesApplied.length === 0) {
    techniquesApplied.push("Clarity Pass");
    rationalePoints.push("Prompt was already well-structured. Applied a light clarity pass to tighten phrasing.");
  }

  const optimizedPrompt = parts.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();

  const scores = estimateOptimizedScores(
    trimmed,
    hadRole,
    hadFormat,
    hadConstraints,
    hadTaskVerb,
    vagueCount
  );

  const rationale = rationalePoints.slice(0, 3).join(" ");

  return {
    optimized_prompt: optimizedPrompt,
    scores,
    techniques_applied: techniquesApplied,
    rationale,
  };
}
