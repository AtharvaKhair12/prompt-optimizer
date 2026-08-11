"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { TiltCard } from "@/components/TiltCard";
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

function getScoreColorValue(score: number): string {
  if (score <= 3) return "oklch(0.6 0.22 20)";
  if (score <= 6) return "oklch(0.8 0.15 90)";
  return "oklch(0.72 0.18 200)";
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
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.5 }}
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
    </motion.span>
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
  const color = getScoreColorValue(score);

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
                <span className={`font-bold tabular-nums ${getScoreColor(score)}`}>
                  {displayed.toFixed(1)}
                </span>
                {delta !== undefined && <DeltaBadge delta={delta} />}
              </span>
            </div>
            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${getBarClass(score)}`}
                initial={animated ? { width: 0 } : { width }}
                animate={{ width }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: animated ? 0.2 : 0 }}
                style={{
                  boxShadow: `0 0 12px ${color}`,
                }}
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
  const overallColor = getScoreColorValue(overall);

  // SVG circular progress
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - overall / 10);

  return (
    <TiltCard className="rounded-xl" tiltDegree={8}>
      <Card className="cyber-panel-premium overflow-hidden border-0">
        <CardContent className="p-5 space-y-4">
          {/* Header with circular score */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {label || "Score"}
            </span>
            <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
              <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="32" cy="32" r={radius} fill="none" stroke="oklch(0.2 0.02 260)" strokeWidth="4" />
                <motion.circle
                  cx="32" cy="32" r={radius} fill="none"
                  stroke={overallColor} strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  style={{ filter: `drop-shadow(0 0 6px ${overallColor})` }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-lg font-black tabular-nums ${getScoreColor(overall)}`}>
                  {displayedOverall.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {prevOverall !== undefined && (
            <div className="flex justify-end -mt-2">
              <DeltaBadge delta={overall - prevOverall} />
            </div>
          )}

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
    </TiltCard>
  );
}

export function ScoreCardSkeleton() {
  return (
    <Card className="cyber-panel-premium overflow-hidden border-0">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-12 animate-shimmer rounded" />
          <div className="h-16 w-16 animate-shimmer rounded-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-4 w-20 animate-shimmer rounded" />
                <div className="h-4 w-6 animate-shimmer rounded" />
              </div>
              <div className="h-2 animate-shimmer rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
