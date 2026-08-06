"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Scores } from "@/lib/types";

interface ScoreCardProps {
  scores: Scores;
  label?: string;
  animated?: boolean;
  prevScores?: Scores; // if provided, show delta badges
}

const SCORE_CONFIG = [
  {
    key: "clarity" as const,
    label: "Clarity",
    description: "How clear and unambiguous the prompt is",
    icon: "💡",
  },
  {
    key: "specificity" as const,
    label: "Specificity",
    description: "How precise and detailed the instructions are",
    icon: "🎯",
  },
  {
    key: "structure" as const,
    label: "Structure",
    description: "How well-organized the prompt format is",
    icon: "🏗️",
  },
  {
    key: "completeness" as const,
    label: "Completeness",
    description: "Whether all necessary context and constraints are included",
    icon: "✅",
  },
];

function getScoreColor(score: number): string {
  if (score <= 3) return "score-low";
  if (score <= 6) return "score-mid";
  return "score-high";
}

function getBarClass(score: number): string {
  if (score <= 3) return "score-bar-low";
  if (score <= 6) return "score-bar-mid";
  return "score-bar-high";
}

function getOverallScore(scores: Scores): number {
  return Math.round(
    (scores.clarity * 0.3 +
      scores.specificity * 0.25 +
      scores.structure * 0.25 +
      scores.completeness * 0.2) *
      10
  ) / 10;
}

/** Animates from 0 → target over ~800ms using requestAnimationFrame */
function useCountUp(target: number, duration = 800, enabled = true): number {
  const [current, setCurrent] = useState(enabled ? 0 : target);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCurrent(target);
      return;
    }

    setCurrent(0);
    startRef.current = null;

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased * 10) / 10);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, enabled]);

  return current;
}

function DeltaBadge({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.1) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/40 ml-1">
        <Minus className="h-2.5 w-2.5" />
      </span>
    );
  }
  const positive = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ml-1 ${
        positive ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {positive ? (
        <TrendingUp className="h-2.5 w-2.5" />
      ) : (
        <TrendingDown className="h-2.5 w-2.5" />
      )}
      {positive ? "+" : ""}
      {delta.toFixed(1)}
    </span>
  );
}

function ScoreRow({
  scoreKey,
  label,
  description,
  icon,
  score,
  prevScore,
  animated,
}: {
  scoreKey: string;
  label: string;
  description: string;
  icon: string;
  score: number;
  prevScore?: number;
  animated: boolean;
}) {
  const displayed = useCountUp(score, 800, animated);
  const width = `${(score / 10) * 100}%`;
  const delta = prevScore !== undefined ? score - prevScore : undefined;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="space-y-1.5 cursor-help">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground/80">
                <span className="text-xs">{icon}</span>
                {label}
              </span>
              <span className="flex items-center">
                <span className={`font-semibold tabular-nums ${getScoreColor(score)}`}>
                  {displayed.toFixed(1)}
                </span>
                {delta !== undefined && <DeltaBadge delta={delta} />}
              </span>
            </div>
            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getBarClass(score)} ${animated ? "animate-score-fill" : ""}`}
                style={
                  {
                    "--score-width": width,
                    width: animated ? undefined : width,
                  } as React.CSSProperties
                }
              />
            </div>
          </div>
        }
      />
      <TooltipContent side="left">
        <p className="text-xs">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function ScoreCard({ scores, label, animated = true, prevScores }: ScoreCardProps) {
  const overall = getOverallScore(scores);
  const prevOverall = prevScores ? getOverallScore(prevScores) : undefined;
  const displayedOverall = useCountUp(overall, 900, animated);

  return (
    <Card className="cyber-panel cyber-3d-tilt overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Header with overall score */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {label || "Score"}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`text-2xl font-bold tabular-nums ${getScoreColor(overall)}`}>
              {displayedOverall.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground/50">/10</span>
            {prevOverall !== undefined && (
              <DeltaBadge delta={overall - prevOverall} />
            )}
          </div>
        </div>

        {/* Individual scores */}
        <div className="space-y-3">
          {SCORE_CONFIG.map(({ key, label: scoreLabel, description, icon }) => (
            <ScoreRow
              key={key}
              scoreKey={key}
              label={scoreLabel}
              description={description}
              icon={icon}
              score={scores[key]}
              prevScore={prevScores?.[key]}
              animated={animated}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ScoreCardSkeleton() {
  return (
    <Card className="cyber-panel cyber-3d-tilt overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-12 animate-shimmer rounded" />
          <div className="h-8 w-16 animate-shimmer rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-4 w-20 animate-shimmer rounded" />
                <div className="h-4 w-6 animate-shimmer rounded" />
              </div>
              <div className="h-1.5 animate-shimmer rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
