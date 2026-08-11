"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Keyboard } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { scorePrompt as heuristicScore, overallScore } from "@/lib/heuristics";
import type { Scores } from "@/lib/types";



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
      ? "oklch(0.6 0.22 20)"
      : score <= 6
        ? "oklch(0.8 0.15 90)"
        : "oklch(0.72 0.18 200)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 44, height: 44 }}>
      <svg width="44" height="44" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="22" cy="22" r={radius} fill="none" stroke="oklch(0.22 0.02 260)" strokeWidth="3" />
        <circle
          cx="22" cy="22" r={radius} fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ 
            transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease",
            filter: `drop-shadow(0 0 4px ${color})`,
          }}
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
      ? "oklch(0.6 0.22 20)"
      : value <= 6
        ? "oklch(0.8 0.15 90)"
        : "oklch(0.72 0.18 200)";

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-muted-foreground/60 capitalize shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/20 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ 
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`,
          }}
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
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="cyber-panel-premium px-4 py-3 space-y-2.5"
    >
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
    </motion.div>
  );
}



// ─── Main Component ───────────────────────────────────────────────────────────

interface PromptInputProps {
  onOptimize: (prompt: string) => void;
  isLoading: boolean;
  onLiveScore?: (score: number | null) => void;
}

export function PromptInput({ onOptimize, isLoading, onLiveScore, initialPrompt = "" }: PromptInputProps & { initialPrompt?: string }) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [liveScores, setLiveScores] = useState<Scores | null>(null);
  const [liveOverall, setLiveOverall] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);
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

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="space-y-3">
      {/* Textarea with animated glow border */}
      <div className={`relative group transition-all duration-500 rounded-xl ${isFocused ? "shadow-[0_0_30px_oklch(0.65_0.22_290_/_0.15)]" : ""}`}>
        {/* Animated gradient border on focus */}
        <div
          className="absolute -inset-[1px] rounded-xl transition-opacity duration-500 pointer-events-none"
          style={{
            opacity: isFocused ? 1 : 0,
            background: "linear-gradient(135deg, oklch(0.65 0.22 290 / 0.5), oklch(0.72 0.18 200 / 0.3), oklch(0.65 0.22 290 / 0.5))",
            backgroundSize: "200% 200%",
            animation: isFocused ? "gradient-shift 3s ease infinite" : "none",
            borderRadius: "inherit",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            padding: "1px",
          }}
        />
        <Textarea
          ref={textareaRef}
          id="prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Paste your prompt here… e.g., 'Write me a good email about the project update'"
          className="min-h-[160px] max-h-[400px] resize-y bg-black/30 border-primary/15 text-foreground placeholder:text-muted-foreground/40 text-base leading-relaxed transition-all duration-300 focus:border-primary/40 focus:ring-0 pr-16 font-mono rounded-xl backdrop-blur-sm shadow-none"
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
                  ? "oklch(0.6 0.22 20)"
                  : charCount > 8000
                    ? "oklch(0.8 0.15 90)"
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
      <AnimatePresence>
        {liveScores && liveOverall !== null && (
          <LiveScorePreview scores={liveScores} overall={liveOverall} />
        )}
      </AnimatePresence>

      {/* Action row */}
      <div className="flex items-center gap-3">
        <Button
          id="optimize-button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          size="lg"
          className="relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 transition-all duration-300 disabled:opacity-40 btn-3d group"
        >
          {/* Shimmer sweep on hover */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
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
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
                <Keyboard className="h-3.5 w-3.5" />
                <kbd className="px-1.5 py-0.5 bg-muted/30 rounded text-[10px] font-mono border border-border/20">
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
            className="text-muted-foreground/50 hover:text-foreground ml-auto"
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
