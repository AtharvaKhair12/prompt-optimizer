/**
 * Rule-based prompt rewriter — zero external dependencies, runs server-side.
 *
 * Analyzes a raw prompt for structural weaknesses and injects targeted
 * improvements using a curated rule set. Returns an OptimizationResult
 * in the same shape as the Gemini API path so the UI is unaffected.
 */

import type { OptimizationResult } from "./types";
import { scorePrompt } from "./heuristics";

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
  | "finance"
  | "medical"
  | "creative"
  | "devops"
  | "general";

const DOMAIN_PATTERNS: Record<Domain, RegExp> = {
  code: /\b(code|function|class|bug|error|implement|refactor|debug|api|deploy|git|test|typescript|javascript|python|java|sql|database|backend|frontend|component|algorithm|script|lint|compile|package|module|library|framework|repo|repository|endpoint|hook|state|interface|type|enum|async|await|promise|react|vue|angular|node|express|fastapi|django|rust|go|kotlin|swift|c\+\+|bash|shell|regex|dockerfile)\b/i,
  data: /\b(data|dataset|analyze|analysis|statistics|chart|graph|visualization|dashboard|metrics|kpi|report|csv|excel|pandas|model|train|predict|ml|machine.?learning|regression|cluster|correlation|etl|pipeline|warehouse|tableau|powerbi|jupyter|numpy|scipy|spark|bigquery|snowflake|dbt|feature.?engineering)\b/i,
  security: /\b(security|vulnerability|exploit|threat|attack|pentest|firewall|encrypt|decrypt|authentication|authorization|oauth|jwt|xss|sql.?injection|malware|phishing|audit|compliance|gdpr|zero.?day|soc|siem|iam|rbac|zero.?trust|incident.?response|ransomware|supply.?chain)\b/i,
  design: /\b(design|ui|ux|interface|wireframe|mockup|prototype|layout|typography|color|brand|logo|figma|sketch|accessibility|responsive|mobile.?design|design.?system|user.?research|usability|heuristic|gestalt|atomic.?design|micro.?interaction|motion.?design)\b/i,
  product: /\b(product|feature|roadmap|prd|requirement|user.?story|acceptance.?criteria|stakeholder|sprint|backlog|mvp|launch|go.?to.?market|persona|feedback|saas|b2b|b2c|product.?strategy|north.?star|okr|prioriti|discovery|jobs.?to.?be.?done)\b/i,
  education: /\b(explain|teach|learn|course|lesson|tutorial|concept|understand|student|beginner|introduction|overview|guide|how.?to|what.?is|definition|example|curriculum|pedagogy|assessment|quiz|flashcard|study.?guide|simplify|eli5)\b/i,
  legal: /\b(legal|law|contract|compliance|regulation|policy|terms|privacy|gdpr|liability|intellectual.?property|copyright|patent|trademark|clause|jurisdiction|arbitration|indemnification|force.?majeure|nda|sla|due.?diligence|litigation)\b/i,
  marketing: /\b(marketing|campaign|seo|ad|advertisement|copy|email.?market|social.?media|content.?market|brand|audience|conversion|funnel|cta|landing.?page|tagline|headline|engagement|growth.?hack|influencer|a\/b.?test|value.?prop|positioning)\b/i,
  research: /\b(research|study|survey|literature.?review|hypothesis|methodology|citation|academic|paper|journal|experiment|findings|peer.?review|thesis|meta.?analysis|systematic.?review|control.?group|sample.?size|qualitative|quantitative|grounded.?theory)\b/i,
  writing: /\b(write|essay|article|blog.?post|email|letter|story|narrative|draft|edit|proofread|tone|voice|paragraph|summary|report|proposal|memo|press.?release|speech|script|copywrite|ghostwrite|publish|format|structure|outline)\b/i,
  finance: /\b(finance|financial|revenue|profit|loss|p&l|balance.?sheet|cash.?flow|valuation|dcf|irr|npv|roi|ebitda|investment|portfolio|stock|equity|debt|budget|forecast|model|startup.?finance|venture|cap.?table|runway|burn.?rate)\b/i,
  medical: /\b(medical|clinical|patient|diagnosis|treatment|symptom|drug|dosage|therapy|surgery|pathology|pharmacology|evidence.?based|clinical.?trial|ehr|icd|cpt|hipaa|protocol|differential|prognosis|etiology|contraindication)\b/i,
  creative: /\b(poem|poetry|fiction|short.?story|novel|screenplay|dialogue|character|plot|worldbuild|metaphor|imagery|rhyme|verse|prose|creative.?writing|storyboard|scene|genre|fantasy|sci-fi|thriller|romance|haiku)\b/i,
  devops: /\b(devops|ci\/cd|pipeline|docker|kubernetes|k8s|helm|terraform|ansible|jenkins|github.?actions|gitlab|monitoring|observability|prometheus|grafana|elk|log|alert|sre|reliability|incident|runbook|infra.?as.?code|cloud|aws|gcp|azure)\b/i,
  general: /.*/,
};

// ─── Domain Roles (Expert Personas) ───────────────────────────────────────────

const DOMAIN_ROLES: Record<Domain, string> = {
  code: "You are a senior software engineer with 12+ years of experience across systems design, algorithms, and full-stack development. You write clean, idiomatic, production-ready code with thorough error handling.",
  data: "You are a senior data scientist and ML engineer with deep expertise in statistical modeling, data visualization, and production ML systems. You communicate findings with precision and quantify uncertainty.",
  security: "You are a CISSP-certified cybersecurity architect with 10+ years in threat modeling, red-teaming, and enterprise security hardening. You prioritize actionable, risk-ranked findings over generic advice.",
  design: "You are a principal UX designer with a background in cognitive psychology and design systems. You make design decisions rooted in user research, accessibility standards (WCAG 2.1 AA), and measurable outcomes.",
  product: "You are a senior product manager with a track record of shipping complex, data-informed products at scale. You ground every recommendation in user evidence, business value, and engineering feasibility.",
  education: "You are a master educator and instructional designer with expertise in adult learning theory. You build mental models through layered explanations, concrete analogies, and active recall techniques.",
  legal: "You are a seasoned legal counsel specializing in technology law, commercial contracts, and regulatory compliance. You surface material risks clearly and flag areas requiring jurisdiction-specific review.",
  marketing: "You are a senior growth and brand strategist with a track record of high-converting campaigns. You combine behavioral psychology with data-driven creative to build messages that resonate and convert.",
  research: "You are a rigorous empirical researcher with expertise in study design, statistical analysis, and academic writing. You apply rigorous methodology, cite sources accurately, and acknowledge limitations.",
  writing: "You are an award-winning editor and published author with a sharp eye for clarity, rhythm, and audience fit. You elevate every piece with purposeful structure, precise word choice, and authentic voice.",
  finance: "You are a CFA-certified financial analyst with deep expertise in corporate finance, valuation modeling, and investment analysis. You present numbers in context with clear assumptions and sensitivity ranges.",
  medical: "You are a clinical expert with extensive knowledge of evidence-based medicine and clinical protocols. You communicate medical information accurately, cite relevant guidelines, and note contraindications.",
  creative: "You are a versatile creative writer with a mastery of narrative craft — structure, voice, imagery, and emotional resonance. You adapt to any genre or style while keeping prose vivid and purposeful.",
  devops: "You are a senior Site Reliability Engineer and DevOps architect with expertise in cloud-native infrastructure, CI/CD, and production reliability. You prioritize automation, observability, and minimal blast radius.",
  general: "You are a highly capable expert assistant with broad, deep knowledge, analytical precision, and a talent for making complex ideas clear and actionable.",
};

// ─── Domain Format Hints ───────────────────────────────────────────────────────

const DOMAIN_FORMAT_HINTS: Record<Domain, string> = {
  code: "Structure your response as: (1) brief approach rationale, (2) well-commented code block with the language specified, (3) key implementation notes and edge cases handled.",
  data: "Present findings as: methodology → results (tables/bullets) → key insights → actionable recommendations. Quantify uncertainty where applicable.",
  security: "Structure as: threat summary → findings ranked by severity (Critical/High/Medium/Low) → specific mitigation steps per finding → verification approach.",
  design: "Organize as: user problem framing → design rationale → specific recommendations with examples → accessibility and usability notes.",
  product: "Use markdown headers for each section. Frame requirements as user stories (As a [user], I want [goal], so that [benefit]). Include acceptance criteria as checkboxes.",
  education: "Structure as: concept overview (1 sentence) → step-by-step explanation with concrete analogies → worked example → common misconceptions → quick-check summary.",
  legal: "Present with clear section headers. Highlight material risks in bold. Note any jurisdiction-specific caveats and flag clauses requiring legal counsel review.",
  marketing: "Format as: core message → audience-specific variations → channel-optimized copy → key performance indicators to track. Lead with the strongest hook.",
  research: "Structure as: research question → methodology → findings → implications → limitations & future directions. Cite sources in-line where relevant.",
  writing: "Deliver the full written piece first, then provide: (1) brief rationale for key stylistic choices, (2) alternative approaches considered, (3) suggested next revision focus.",
  finance: "Present as: key assumptions → model output (with ranges) → sensitivity analysis on major drivers → interpretation and risks. Avoid presenting numbers without context.",
  medical: "Format as: clinical context → evidence summary (citing guideline/study) → practical application → contraindications/warnings → recommended next steps. Note this is for informational purposes only.",
  creative: "Deliver the creative piece in full. Then briefly note: (1) intentional craft choices (voice, structure, imagery), (2) where you took creative liberties, (3) suggested variations.",
  devops: "Structure as: architecture/approach overview → step-by-step implementation → monitoring and rollback strategy → known failure modes and mitigations.",
  general: "Lead with a direct answer or executive summary. Follow with supporting detail. Close with caveats, open questions, or recommended next steps.",
};

// ─── Domain Constraint Libraries ──────────────────────────────────────────────

const DOMAIN_CONSTRAINTS: Record<Domain, string[]> = {
  code: [
    "Write production-ready code: handle edge cases, include error handling, avoid deprecated APIs",
    "Prefer readability and maintainability over clever one-liners",
    "Include type annotations where the language supports them",
  ],
  data: [
    "State all assumptions explicitly before presenting results",
    "Quantify uncertainty (confidence intervals, p-values, or qualitative confidence level)",
    "Distinguish correlation from causation — flag speculative causal claims",
  ],
  security: [
    "Rank findings by severity: Critical > High > Medium > Low",
    "Provide specific, actionable mitigations — avoid generic 'improve your security' advice",
    "Note any compliance implications (e.g., GDPR, SOC 2, HIPAA)",
  ],
  design: [
    "Ground every design decision in user behavior or research — not aesthetics alone",
    "Flag any WCAG 2.1 AA accessibility implications",
    "Prefer proven patterns over novel ones unless novelty is justified",
  ],
  product: [
    "Every requirement must be testable, unambiguous, and traceable to a user need",
    "Ground recommendations in evidence (user research, data) not assumptions",
    "Include a clear success metric for each major feature or initiative",
  ],
  education: [
    "Do not assume prior knowledge beyond what is explicitly stated",
    "Use concrete, relatable analogies to illustrate abstract concepts",
    "Check understanding at key points — surface the most common misconception",
  ],
  legal: [
    "Flag material risks clearly with severity indicators",
    "Note when analysis is jurisdiction-specific or when local legal counsel is advised",
    "Do not present legal analysis as a substitute for professional legal advice",
  ],
  marketing: [
    "Ground the message in a specific audience insight — avoid generic broad claims",
    "Every claim should be defensible and specific; avoid superlatives without evidence",
    "Include a clear, singular call-to-action per piece of copy",
  ],
  research: [
    "Distinguish between findings from primary sources and synthesized interpretations",
    "Acknowledge study limitations and alternative explanations for key findings",
    "Use precise academic language — define specialized terms on first use",
  ],
  writing: [
    "Match tone, register, and reading level to the stated or implied audience",
    "Ensure logical flow between sections — each paragraph should have a clear purpose",
    "Show, don't tell — use specific details and concrete examples over abstract claims",
  ],
  finance: [
    "State all model assumptions explicitly and explain their basis",
    "Present results with sensitivity ranges, not just point estimates",
    "Flag model limitations and scenarios where the analysis breaks down",
  ],
  medical: [
    "Cite specific clinical guidelines, studies, or evidence levels (e.g., Grade A/B/C)",
    "Flag contraindications, drug interactions, and population-specific caveats explicitly",
    "This information is for educational/informational purposes — not a substitute for professional medical advice",
  ],
  creative: [
    "Prioritize emotional resonance and specificity over generic descriptions",
    "Show character through action and dialogue, not exposition",
    "Every scene or stanza should serve the work — cut what does not contribute",
  ],
  devops: [
    "Treat infrastructure as code — all changes should be version-controlled and reviewable",
    "Design for failure — include rollback and recovery strategies",
    "Prefer minimal blast radius: scope changes to the smallest safe unit of deployment",
  ],
  general: [
    "Ground your response in facts — flag anything speculative or uncertain",
    "Be precise and avoid unnecessary padding, hedging, or repetition",
    "Structure the output logically so the most important information comes first",
  ],
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
  kinda: "approximately",
  "sort of": "specifically",
  "a lot": "a significant number of",
  very: "",
  really: "",
  basically: "in essence",
  just: "",
  whatever: "whichever approach is most appropriate",
  maybe: "ideally",
  probably: "it is expected that",
  "i guess": "",
  "i think": "based on my requirements,",
  simple: "straightforward and well-explained",
  easy: "approachable with clear steps",
  quick: "concise and direct",
  big: "significant",
  small: "minimal",
};

// ─── Pattern Matchers ──────────────────────────────────────────────────────────

const VAGUE_WORDS = /\b(something|stuff|things?|etc\.?|good|nice|great|cool|interesting|whatever|somehow|kinda|sort\s*of|a\s*lot|very|really|basically|just|maybe|probably|simple|easy|quick|big|small)\b/gi;
const OUTPUT_FORMAT_KEYWORDS = /\b(json|csv|xml|html|markdown|md|list|table|bullet|numbered|format|schema|yaml|toml|structured|template|code\s*block|numbered\s*list|step.?by.?step)\b/i;
const ROLE_PATTERNS = /\b(you\s+are|act\s+as|as\s+a|role|persona|imagine\s+you|pretend|you're\s+a|behave\s+as|take\s+the\s+role)\b/i;
const CONSTRAINT_PATTERNS = /\b(must|should|do\s+not|don't|cannot|at\s+most|at\s+least|no\s+more\s+than|maximum|minimum|limit|restrict|between|within|exactly|only|never|always|ensure|require|mandatory|forbidden)\b/i;
const EXAMPLE_PATTERNS = /\b(for\s+example|e\.?g\.?|such\s+as|like\s+this|here'?s?\s+an?\s+example|sample|instance|illustration|demo|consider|input:|output:)\b|```/i;
const TASK_VERBS = /\b(write|create|generate|explain|analyze|summarize|translate|compare|evaluate|describe|list|design|implement|build|refactor|debug|review|optimize|convert|extract|classify|recommend|suggest|outline|draft|compose|rewrite|improve|fix|identify|calculate|define|elaborate|develop|plan|propose|solve|assess|verify|validate|audit|deploy|configure|migrate|architect|integrate|automate|test)\b/i;
const MULTI_TURN_PATTERNS = /\b(continue|follow.?up|previous|above|earlier|as.?discussed|context:|system:|user:|assistant:|history:|conversation|thread|session|remember\s+that|given\s+that)\b/i;
const CHAIN_OF_THOUGHT_TRIGGERS = /\b(complex|multi.?step|reason|logic|why|how\s+does|analyze|evaluate|trade.?off|compare|recommend|decision|strategy|architecture|diagnose|troubleshoot)\b/i;
const VERBOSE_INDICATORS = /\b(please|kindly|would\s+you|could\s+you|i\s+was\s+wondering|if\s+possible|whenever\s+you\s+can|hope\s+that|appreciate\s+if|feel\s+free)\b/gi;

// ─── Domain Inference ──────────────────────────────────────────────────────────

function inferDomain(prompt: string): Domain {
  const scores: Partial<Record<Domain, number>> = {};

  for (const [domain, pattern] of Object.entries(DOMAIN_PATTERNS) as [Domain, RegExp][]) {
    if (domain === "general") continue;
    const matches = prompt.match(new RegExp(pattern.source, "gi"));
    scores[domain] = matches?.length ?? 0;
  }

  const best = Object.entries(scores).sort((a, b) => (b[1] as number) - (a[1] as number));
  if (best.length > 0 && (best[0][1] as number) > 0) return best[0][0] as Domain;
  return "general";
}

// ─── Constraint Generator ──────────────────────────────────────────────────────

function generateConstraints(prompt: string, domain: Domain): string {
  const domainConstraints = DOMAIN_CONSTRAINTS[domain];

  // Pick the 2 most relevant domain constraints
  const selected = domainConstraints.slice(0, 2);

  // Add a universal length/depth constraint
  if (/\b(explain|describe|overview|summary|summarize|eli5)\b/i.test(prompt)) {
    selected.push("Keep your response focused and concise — prioritize clarity over exhaustiveness");
  } else if (/\b(comprehensive|detailed|thorough|complete|full|in-depth|deep.?dive)\b/i.test(prompt)) {
    selected.push("Be thorough and comprehensive — do not omit important nuances or edge cases");
  } else {
    selected.push("Be precise — avoid filler, over-hedging, or restating the question before answering");
  }

  return selected.map((c, i) => `${i + 1}. ${c}`).join("\n");
}

// ─── Task Verb Inferrer ────────────────────────────────────────────────────────

function inferTaskVerb(prompt: string): string {
  if (/\?/.test(prompt)) return "Answer the following clearly, thoroughly, and with concrete examples:";
  if (/\b(how|what|why|when|where|who|which)\b/i.test(prompt)) return "Explain the following with precision:";
  if (/\b(help|assist|support)\b/i.test(prompt)) return "Provide expert, actionable assistance with the following:";
  if (/\b(review|check|evaluate|assess|audit)\b/i.test(prompt)) return "Critically evaluate the following:";
  if (/\b(fix|debug|troubleshoot|resolve)\b/i.test(prompt)) return "Diagnose and resolve the following issue:";
  if (/\b(build|create|design|make|develop)\b/i.test(prompt)) return "Design and implement the following:";
  return "Complete the following task with precision and depth:";
}

// ─── Chain-of-Thought Injector ─────────────────────────────────────────────────

function shouldInjectChainOfThought(prompt: string): boolean {
  return CHAIN_OF_THOUGHT_TRIGGERS.test(prompt) && prompt.length > 80;
}

// ─── Verbose Cleaner ───────────────────────────────────────────────────────────

function removePoliteNoise(prompt: string): { text: string; cleaned: boolean } {
  const cleaned = prompt.replace(VERBOSE_INDICATORS, "").replace(/\s{2,}/g, " ").trim();
  return { text: cleaned, cleaned: cleaned !== prompt };
}

// ─── Compression Detector ──────────────────────────────────────────────────────

function isVerbosePrompt(prompt: string): boolean {
  // A prompt is "verbose" if it's >400 chars and has many filler phrases
  const fillerCount = (prompt.match(VERBOSE_INDICATORS) || []).length;
  return prompt.length > 400 && fillerCount >= 2;
}

// ─── Multi-turn Detector ───────────────────────────────────────────────────────

function isMultiTurnPrompt(prompt: string): boolean {
  return MULTI_TURN_PATTERNS.test(prompt);
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
  return { text: text.replace(/\s{2,}/g, " ").trim(), count };
}

// ─── Code Block Protector ─────────────────────────────────────────────────────

/**
 * Extracts fenced code blocks so transforms (vague-word replacement, task-verb
 * injection, etc.) cannot mangle code content. Returns a restore function.
 */
function protectCodeBlocks(text: string): {
  safe: string;
  restore: (s: string) => string;
} {
  const blocks: string[] = [];
  const safe = text.replace(/```[\s\S]*?```/g, (match) => {
    blocks.push(match);
    return `__CODEBLOCK_${blocks.length - 1}__`;
  });
  return {
    safe,
    restore: (s: string) =>
      s.replace(/__CODEBLOCK_(\d+)__/g, (_, i) => blocks[Number(i)] ?? ""),
  };
}

// ─── Main Rewriter ─────────────────────────────────────────────────────────────

export function rewritePrompt(prompt: string): OptimizationResult {
  const trimmed = prompt.trim();
  const domain = inferDomain(trimmed);
  const isVerbose = isVerbosePrompt(trimmed);
  const isMultiTurn = isMultiTurnPrompt(trimmed);
  const hasCodeBlocks = /```/.test(trimmed);

  // ── Detect what's already present ─────────────────────────────────────────
  const hadRole        = ROLE_PATTERNS.test(trimmed);
  const hadFormat      = OUTPUT_FORMAT_KEYWORDS.test(trimmed);
  const hadConstraints = CONSTRAINT_PATTERNS.test(trimmed);
  const hadTaskVerb    = TASK_VERBS.test(trimmed);
  // Code blocks count as examples — don't elicit more
  const hadExamples    = EXAMPLE_PATTERNS.test(trimmed) || hasCodeBlocks;

  // ── Protect code blocks, then apply transforms only to prose text ─────────
  const { safe, restore } = protectCodeBlocks(trimmed);
  const { text: denoised, cleaned: removedNoise } = removePoliteNoise(safe);
  const { text: cleanedSafe, count: vagueCount } = replaceVagueWords(denoised);
  // Restore code blocks back into cleaned prose
  const cleanedPrompt = restore(cleanedSafe);

  // Chain-of-thought only on analytical prompts without code blocks
  const addCot = shouldInjectChainOfThought(cleanedPrompt) && !isMultiTurn && !hasCodeBlocks;
  // Skip generic task-verb injection when code is present (looks wrong before a code block)
  const shouldInjectTaskVerb = !hadTaskVerb && !hasCodeBlocks;

  // ── Build the rewritten prompt ────────────────────────────────────────────
  const parts: string[] = [];
  const techniquesApplied: string[] = [];
  const rationalePoints: string[] = [];

  // 1. Role injection
  if (!hadRole) {
    parts.push(DOMAIN_ROLES[domain] + ".");
    techniquesApplied.push("Expert Persona Assignment");
    rationalePoints.push(`Assigned a domain-specific expert persona (${domain}) to orient the model's reasoning and vocabulary before the task.`);
  }

  // 2. Chain-of-thought trigger
  if (addCot) {
    parts.push("Think through this step-by-step before providing your final answer.");
    techniquesApplied.push("Chain-of-Thought Priming");
    rationalePoints.push("Added a chain-of-thought directive to improve accuracy on multi-step or analytical tasks by encouraging explicit reasoning.");
  }

  // 3. Task verb / clear directive (skipped when prompt already has code blocks)
  if (shouldInjectTaskVerb) {
    parts.push(inferTaskVerb(cleanedPrompt));
    techniquesApplied.push("Explicit Action Directive");
    rationalePoints.push("Added an explicit action verb to remove ambiguity about what output is expected from the model.");
  }

  // 4. The core prompt (cleaned)
  parts.push(cleanedPrompt);

  // 5. Multi-turn context note
  if (isMultiTurn) {
    parts.push("\nNote: This prompt references a prior conversation. Ensure your response integrates the established context without repeating it unnecessarily.");
    techniquesApplied.push("Multi-turn Context Anchoring");
    rationalePoints.push("Detected cross-turn references — added a context-anchoring instruction to prevent the model from ignoring conversation history.");
  }

  // 6. Output format instruction
  if (!hadFormat) {
    parts.push("\n" + DOMAIN_FORMAT_HINTS[domain]);
    techniquesApplied.push("Output Format Specification");
    rationalePoints.push("Specified a domain-appropriate output structure to guide the model toward a consistent, parseable response.");
  }

  // 7. Constraints
  if (!hadConstraints) {
    const constraints = generateConstraints(trimmed, domain);
    parts.push("\nAdhere to the following requirements:\n" + constraints);
    techniquesApplied.push("Quality Constraints");
    rationalePoints.push("Injected domain-specific quality constraints to bound the solution space and prevent common failure modes.");
  }

  // 8. Vague word replacement
  if (vagueCount > 0) {
    techniquesApplied.push("Precision Language Pass");
    rationalePoints.push(`Replaced ${vagueCount} vague term${vagueCount > 1 ? "s" : ""} with precise alternatives to reduce model interpretation ambiguity.`);
  }

  // 9. Noise removal
  if (removedNoise) {
    techniquesApplied.push("Filler Removal");
    rationalePoints.push("Stripped courtesy phrases that add length without adding information, improving the signal-to-noise ratio.");
  }

  // 10. Example elicitation (short prompts without existing code/examples only)
  if (!hadExamples && !isMultiTurn && !hasCodeBlocks && trimmed.length < 150 && trimmed.length > 20) {
    parts.push("\nIf a concrete input/output example would clarify the expected format, include one in your response.");
    techniquesApplied.push("Example Elicitation");
    rationalePoints.push("Invited an inline example to anchor the expected output format and reduce hallucination risk.");
  }

  // Fallback
  if (techniquesApplied.length === 0) {
    techniquesApplied.push("Clarity Refinement");
    rationalePoints.push("Prompt was already well-structured. Applied a light clarity and precision pass.");
  }

  const optimizedPrompt = parts.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();

  // ── Score the ACTUAL rewritten text through the real heuristic pipeline ────
  // The rewritten prompt always has role + format + constraints injected, so it
  // will naturally score higher on every dimension than the raw input.
  const { scores } = scorePrompt(optimizedPrompt);

  // Top 3 rationale points, joined
  const rationale = rationalePoints.slice(0, 3).join(" ");

  return {
    optimized_prompt: optimizedPrompt,
    scores,
    techniques_applied: techniquesApplied,
    rationale,
  };
}
