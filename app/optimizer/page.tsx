"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar, saveToLocalHistory } from "@/components/Sidebar";
import { PromptInput } from "@/components/PromptInput";
import { ScoreCard, ScoreCardSkeleton } from "@/components/ScoreCard";
import { DiffView, DiffViewSkeleton } from "@/components/DiffView";
import { CursorGlow } from "@/components/CursorGlow";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { scorePrompt as heuristicScore } from "@/lib/heuristics";
import type { OptimizationResult, Scores, OptimizationEntry } from "@/lib/types";
import { useSession } from "next-auth/react";
import { AlertCircle, Zap, Brain, Sparkles, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: session } = useSession();

  // ── State ──────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  // Heuristic (instant) results
  const [heuristicScores, setHeuristicScores] = useState<Scores | null>(null);
  const [heuristicFlags, setHeuristicFlags] = useState<string[]>([]);

  // Rewriter results
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [originalPrompt, setOriginalPrompt] = useState("");

  // History refresh trigger
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // Initial prompt for template selection
  const [initialPrompt, setInitialPrompt] = useState("");

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

  const handleTemplateSelect = useCallback((text: string) => {
    setInitialPrompt(text);
  }, []);

  const handleNewChat = useCallback(() => {
    setOriginalPrompt("");
    setResult(null);
    setHeuristicScores(null);
    setHeuristicFlags([]);
    setError(null);
    setInitialPrompt("");
    setResetKey(prev => prev + 1);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <CursorGlow />

      {/* Sidebar (Left) */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onRestore={handleHistoryRestore}
        onTemplateSelect={handleTemplateSelect}
        onNewChat={handleNewChat}
        refreshTrigger={historyRefresh}
      />

      <main className="flex-1 overflow-y-auto relative">
        {/* Toggle button when sidebar is closed */}
        <AnimatePresence>
          {!isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute top-4 left-4 z-50"
            >
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 backdrop-blur-xl border border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5 text-primary" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-4xl w-full mx-auto px-6 py-12 space-y-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center space-y-6 pt-8 pb-4"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]">
              <span className="gradient-text">Prompt</span>{" "}
              <span className="text-foreground">Optimizer</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
              Transform vague prompts into precise, well-structured instructions
              that get better results from any LLM. Professional grade optimization, instantly.
            </p>

            {/* Pipeline badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {[
                { icon: Zap, label: "Live Scoring", color: "primary" },
                { icon: Brain, label: "Domain Detection", color: "secondary" },
                { icon: Sparkles, label: "Smart Rewrite", color: "primary" },
              ].map(({ icon: Icon, label, color }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <Badge variant="secondary" className="px-3 py-1.5 gap-1.5 text-xs font-medium bg-white/3 hover:bg-white/6 text-muted-foreground border-white/8 transition-colors rounded-full backdrop-blur-md shadow-sm">
                    <Icon className={`h-3.5 w-3.5 text-${color}`} />
                    {label}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Prompt Input with live scoring */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <PromptInput key={resetKey} onOptimize={handleOptimize} isLoading={isLoading} initialPrompt={initialPrompt} />
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-destructive/20 bg-destructive/5 animate-shake">
                  <CardContent className="p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Heuristic flags */}
          <AnimatePresence>
            {heuristicFlags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider">
                  Instant Analysis
                </p>
                <div className="flex flex-wrap gap-2">
                  {heuristicFlags.map((flag, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Badge
                        variant="outline"
                        className="text-xs border-yellow-500/15 text-yellow-500/70 bg-yellow-500/5"
                      >
                        {flag}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {(isLoading || result) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6"
              >
                {/* Score Cards */}
                <div className="space-y-4">
                  {heuristicScores && !isLoading && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <ScoreCard scores={heuristicScores} label="Before" animated={false} />
                    </motion.div>
                  )}

                  {isLoading ? (
                    <ScoreCardSkeleton />
                  ) : result ? (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <ScoreCard
                        scores={result.scores}
                        label="After"
                        animated={true}
                        prevScores={heuristicScores ?? undefined}
                      />
                    </motion.div>
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!result && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center pt-8 pb-12"
            >
              <div className="inline-flex flex-col items-center gap-3 text-muted-foreground/20">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="h-8 w-8" />
                </motion.div>
                <span className="text-sm">Paste a prompt above to get started</span>
              </div>
            </motion.div>
          )}
          
          {/* Footer */}
          <footer className="border-t border-border/8 mt-12 py-6 text-center text-xs text-muted-foreground/25">
            <p>
              100% on-device optimization — no API key, no sign-up, no data sent to third parties.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
