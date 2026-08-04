"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Keyboard } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { scorePrompt as heuristicScore } from "@/lib/heuristics";
import { overallScore } from "@/lib/heuristics";

interface PromptInputProps {
  onOptimize: (prompt: string) => void;
  isLoading: boolean;
  onLiveScore?: (score: number | null) => void;
}

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
        {/* Track */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="oklch(0.25 0.02 280)"
          strokeWidth="3"
        />
        {/* Progress */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
        />
      </svg>
      <span
        className="absolute text-[11px] font-bold tabular-nums"
        style={{ color, transition: "color 0.3s ease" }}
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
}

export function PromptInput({ onOptimize, isLoading, onLiveScore }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = prompt.length;
  const isOverLimit = charCount > 10000;
  const canSubmit = prompt.trim().length > 0 && !isLoading && !isOverLimit;

  const debouncedPrompt = useDebounce(prompt, 400);

  // Compute live score from the debounced prompt
  useEffect(() => {
    if (debouncedPrompt.trim().length < 10) {
      setLiveScore(null);
      onLiveScore?.(null);
      return;
    }
    const { scores } = heuristicScore(debouncedPrompt);
    const s = overallScore(scores);
    setLiveScore(s);
    onLiveScore?.(s);
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

        {/* Live score ring — bottom right of textarea */}
        <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1">
          {liveScore !== null ? (
            <ScoreRing score={liveScore} />
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
          {liveScore !== null && (
            <span className="text-[9px] text-muted-foreground/30 leading-none">before</span>
          )}
        </div>
      </div>

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
    </div>
  );
}
