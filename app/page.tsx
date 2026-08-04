"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { PromptInput } from "@/components/PromptInput";
import { ScoreCard, ScoreCardSkeleton } from "@/components/ScoreCard";
import { DiffView, DiffViewSkeleton } from "@/components/DiffView";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { saveToLocalHistory } from "@/components/HistoryPanel";
import { scorePrompt as heuristicScore } from "@/lib/heuristics";
import type { OptimizationResult, Scores, OptimizationEntry } from "@/lib/types";
import { useSession } from "next-auth/react";
import { AlertCircle, Zap, Brain, Sparkles } from "lucide-react";

export default function Home() {
  const { data: session } = useSession();

  // ── State ──────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Heuristic (instant) results
  const [heuristicScores, setHeuristicScores] = useState<Scores | null>(null);
  const [heuristicFlags, setHeuristicFlags] = useState<string[]>([]);

  // Rewriter results
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [originalPrompt, setOriginalPrompt] = useState("");

  // History refresh trigger
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleOptimize = useCallback(
    async (prompt: string) => {
      setError(null);
      setOriginalPrompt(prompt);

      // Phase 1: Instant heuristic scoring (client-side, zero latency)
      const heuristics = heuristicScore(prompt);
      setHeuristicScores(heuristics.scores);
      setHeuristicFlags(heuristics.flags);

      // Phase 2: Rule-based rewrite (server-side, no API key needed)
      setIsLoading(true);
      setResult(null);

      try {
        const res = await fetch("/api/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Optimization failed");
        }

        setResult(data);

        // Save to local history for anonymous users
        const entry: OptimizationEntry = {
          id: Date.now().toString(),
          originalPrompt: prompt,
          optimizedPrompt: data.optimized_prompt,
          scores: data.scores,
          techniquesApplied: data.techniques_applied,
          rationale: data.rationale,
          createdAt: new Date().toISOString(),
        };

        if (!session?.user) {
          saveToLocalHistory(entry);
        }

        setHistoryRefresh((prev) => prev + 1);
      } catch (err: any) {
        setError(err.message || "Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [session]
  );

  const handleHistoryRestore = useCallback((entry: OptimizationEntry) => {
    setOriginalPrompt(entry.originalPrompt);
    setResult({
      optimized_prompt: entry.optimizedPrompt,
      scores: entry.scores,
      techniques_applied: entry.techniquesApplied,
      rationale: entry.rationale,
    });
    setHeuristicScores(null);
    setHeuristicFlags([]);
    setError(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        onHistoryRestore={handleHistoryRestore}
        historyRefreshTrigger={historyRefresh}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
            Optimize Your Prompts
          </h2>
          <p className="text-muted-foreground/70 max-w-lg mx-auto text-sm sm:text-base">
            Transform vague prompts into precise, well-structured instructions
            that get better results from any LLM — instantly, no setup needed.
          </p>

          {/* Pipeline badges */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <Badge variant="secondary" className="gap-1 text-xs bg-muted/30 text-muted-foreground/60">
              <Zap className="h-3 w-3" />
              Live Scoring
            </Badge>
            <Badge variant="secondary" className="gap-1 text-xs bg-muted/30 text-muted-foreground/60">
              <Brain className="h-3 w-3" />
              Domain Detection
            </Badge>
            <Badge variant="secondary" className="gap-1 text-xs bg-muted/30 text-muted-foreground/60">
              <Sparkles className="h-3 w-3" />
              Smart Rewrite
            </Badge>
          </div>
        </div>

        {/* Prompt Input with live scoring */}
        <PromptInput onOptimize={handleOptimize} isLoading={isLoading} />

        {/* Error */}
        {error && (
          <Card className="border-destructive/30 bg-destructive/5 animate-fade-in-up">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Heuristic flags (shown instantly while rewriter is running) */}
        {heuristicFlags.length > 0 && (
          <div className="space-y-2 animate-fade-in-up">
            <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
              Instant Analysis
            </p>
            <div className="flex flex-wrap gap-2">
              {heuristicFlags.map((flag, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-xs border-yellow-500/20 text-yellow-500/80 bg-yellow-500/5"
                >
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {(isLoading || result) && (
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
            {/* Score Cards */}
            <div className="space-y-4">
              {heuristicScores && !isLoading && (
                <div className="animate-fade-in-up">
                  <ScoreCard scores={heuristicScores} label="Before" animated={false} />
                </div>
              )}

              {isLoading ? (
                <ScoreCardSkeleton />
              ) : result ? (
                <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                  {/* Pass prevScores so the After card shows deltas */}
                  <ScoreCard
                    scores={result.scores}
                    label="After"
                    animated={true}
                    prevScores={heuristicScores ?? undefined}
                  />
                </div>
              ) : null}
            </div>

            {/* Diff View */}
            <div>
              {isLoading ? (
                <DiffViewSkeleton />
              ) : result ? (
                <DiffView
                  original={originalPrompt}
                  optimized={result.optimized_prompt}
                  techniques={result.techniques_applied}
                  rationale={result.rationale}
                />
              ) : null}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !isLoading && (
          <div className="text-center pt-8 pb-12">
            <div className="inline-flex items-center gap-2 text-muted-foreground/30 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Paste a prompt above to get started</span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 py-4 text-center text-xs text-muted-foreground/30">
        <p>
          100% on-device optimization — no API key, no sign-up, no data sent to third parties.
        </p>
      </footer>
    </div>
  );
}
