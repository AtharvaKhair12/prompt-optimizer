"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Keyboard, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { scorePrompt as heuristicScore, overallScore } from "@/lib/heuristics";
import type { Scores } from "@/lib/types";

// ─── Prompt Templates ─────────────────────────────────────────────────────────

interface Template {
  label: string;
  emoji: string;
  text: string;
}

const TEMPLATES: Template[] = [
  {
    label: "Code Review",
    emoji: "💻",
    text: "Review this code and suggest improvements:\n\n```\n// paste your code here\n```",
  },
  {
    label: "Email Writer",
    emoji: "✉️",
    text: "Write a professional email to [recipient] about [topic]. The tone should be [formal/friendly]. Key points to cover: [point 1], [point 2].",
  },
  {
    label: "Explain Concept",
    emoji: "🎓",
    text: "Explain [concept] to someone with [beginner/intermediate] knowledge of [field]. Use a real-world analogy and a concrete example.",
  },
  {
    label: "Data Analysis",
    emoji: "📊",
    text: "Analyze the following dataset and identify the top 3 insights:\n\n[paste data or describe it here]\n\nFocus on: trends, outliers, and actionable recommendations.",
  },
  {
    label: "Debug Issue",
    emoji: "🔍",
    text: "I'm getting this error:\n\n```\n[error message]\n```\n\nHere is the relevant code:\n\n```\n[code]\n```\n\nWhat is causing it and how do I fix it?",
  },
  {
    label: "Product PRD",
    emoji: "📋",
    text: "Write a PRD for a feature that lets users [goal]. Target users: [persona]. Success metric: [metric]. Constraints: [any constraints].",
  },
  {
    label: "Marketing Copy",
    emoji: "📣",
    text: "Write compelling marketing copy for [product/service]. Target audience: [audience]. Key benefit: [benefit]. Tone: [tone]. Format: [landing page headline / email subject / ad copy].",
  },
  {
    label: "Research Summary",
    emoji: "🔬",
    text: "Summarize the current state of research on [topic]. Cover: key findings, leading methodologies, open questions, and practical implications for [field/use case].",
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function ScoreRing({ score, max = 10 }: { score: number; max?: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const pct = score / max;
  const offset = circumference * (1 - pct);

  const color =
    score <= 3
      ? "oklch(0.65 0.2 25)"
      : score <= 6
        ? "oklch(0.75 0.15 85)"
        : "oklch(0.7 0.18 150)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 44, height: 44 }}>
      <svg width="44" height="44" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="22" cy="22" r={radius} fill="none" stroke="oklch(0.25 0.02 280)" strokeWidth="3" />
        <circle
          cx="22" cy="22" r={radius} fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold tabular-nums" style={{ color, transition: "color 0.3s ease" }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function DimensionBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 10) * 100;
  const color =
    value <= 3
      ? "oklch(0.65 0.2 25)"
      : value <= 6
        ? "oklch(0.75 0.15 85)"
        : "oklch(0.7 0.18 150)";

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-muted-foreground/60 capitalize shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-6 text-right tabular-nums font-medium" style={{ color }}>
        {value.toFixed(0)}
      </span>
    </div>
  );
}

interface LiveScorePreviewProps {
  scores: Scores;
  overall: number;
}

function LiveScorePreview({ scores, overall }: LiveScorePreviewProps) {
  return (
    <div className="border border-border/30 rounded-xl bg-card/40 backdrop-blur-sm px-4 py-3 space-y-2.5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Live Quality Preview
        </span>
        <ScoreRing score={overall} />
      </div>
      <div className="space-y-1.5">
        <DimensionBar label="Clarity" value={scores.clarity} />
        <DimensionBar label="Specificity" value={scores.specificity} />
        <DimensionBar label="Structure" value={scores.structure} />
        <DimensionBar label="Completeness" value={scores.completeness} />
      </div>
    </div>
  );
}

// ─── Template Picker ──────────────────────────────────────────────────────────

interface TemplatePickerProps {
  onSelect: (text: string) => void;
}

function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors group"
        aria-expanded={open}
        aria-controls="template-grid"
      >
        <Lightbulb className="h-3.5 w-3.5 group-hover:text-primary/70 transition-colors" />
        <span>Try an example</span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div
          id="template-grid"
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-in-up"
        >
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.label}
              onClick={() => {
                onSelect(tpl.text);
                setOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/30 bg-muted/10 hover:bg-muted/30 hover:border-primary/30 transition-all duration-150 text-left group"
              title={tpl.text.slice(0, 80) + "…"}
            >
              <span className="text-base leading-none">{tpl.emoji}</span>
              <span className="text-xs text-muted-foreground/70 group-hover:text-foreground transition-colors truncate">
                {tpl.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface PromptInputProps {
  onOptimize: (prompt: string) => void;
  isLoading: boolean;
  onLiveScore?: (score: number | null) => void;
}

export function PromptInput({ onOptimize, isLoading, onLiveScore }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [liveScores, setLiveScores] = useState<Scores | null>(null);
  const [liveOverall, setLiveOverall] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = prompt.length;
  const isOverLimit = charCount > 10000;
  const canSubmit = prompt.trim().length > 0 && !isLoading && !isOverLimit;

  const debouncedPrompt = useDebounce(prompt, 400);

  // Compute live score from the debounced prompt
  useEffect(() => {
    if (debouncedPrompt.trim().length < 10) {
      setLiveScores(null);
      setLiveOverall(null);
      onLiveScore?.(null);
      return;
    }
    const { scores } = heuristicScore(debouncedPrompt);
    const overall = overallScore(scores);
    setLiveScores(scores);
    setLiveOverall(overall);
    onLiveScore?.(overall);
  }, [debouncedPrompt, onLiveScore]);

  const handleSubmit = useCallback(() => {
    if (canSubmit) onOptimize(prompt.trim());
  }, [canSubmit, onOptimize, prompt]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTemplateSelect = useCallback((text: string) => {
    setPrompt(text);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="space-y-3">
      {/* Template Picker */}
      <TemplatePicker onSelect={handleTemplateSelect} />

      {/* Textarea */}
      <div className="relative group">
        <Textarea
          ref={textareaRef}
          id="prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste your prompt here… e.g., 'Write me a good email about the project update'"
          className="min-h-[160px] max-h-[400px] resize-y bg-card/50 border-border/50 text-foreground placeholder:text-muted-foreground/50 text-base leading-relaxed transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-card/80 pr-16"
          disabled={isLoading}
          aria-label="Enter your prompt to optimize"
        />

        {/* Char count / ring — bottom right of textarea */}
        <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1">
          {liveOverall !== null ? (
            <ScoreRing score={liveOverall} />
          ) : (
            <div
              className="text-xs tabular-nums text-muted-foreground/40 transition-colors"
              style={{
                color: isOverLimit
                  ? "oklch(0.65 0.2 25)"
                  : charCount > 8000
                    ? "oklch(0.75 0.15 85)"
                    : undefined,
              }}
            >
              {charCount.toLocaleString()} / 10k
            </div>
          )}
          {liveOverall !== null && (
            <span className="text-[9px] text-muted-foreground/30 leading-none">before</span>
          )}
        </div>
      </div>

      {/* Live dimension bars */}
      {liveScores && liveOverall !== null && (
        <LiveScorePreview scores={liveScores} overall={liveOverall} />
      )}

      {/* Action row */}
      <div className="flex items-center gap-3">
        <Button
          id="optimize-button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          size="lg"
          className="relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 transition-all duration-200 disabled:opacity-40"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Optimizing…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Optimize
            </>
          )}
        </Button>

        <Tooltip>
          <TooltipTrigger
            render={
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                <Keyboard className="h-3.5 w-3.5" />
                <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px] font-mono">
                  Ctrl+Enter
                </kbd>
              </div>
            }
          />
          <TooltipContent>
            <p>Press Ctrl+Enter (or ⌘+Enter) to optimize</p>
          </TooltipContent>
        </Tooltip>

        {prompt.trim().length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPrompt("")}
            className="text-muted-foreground/60 hover:text-foreground ml-auto"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Character count when no live score */}
      {liveOverall === null && charCount > 0 && (
        <div className="flex justify-end">
          <Badge
            variant="outline"
            className="text-[10px] text-muted-foreground/40 border-border/20 bg-transparent"
          >
            {charCount.toLocaleString()} / 10,000 chars
          </Badge>
        </div>
      )}
    </div>
  );
}
