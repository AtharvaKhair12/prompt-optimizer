"use client";

import { Sparkles } from "lucide-react";
import { AuthButton } from "./AuthButton";
import { HistoryPanel } from "./HistoryPanel";
import type { OptimizationEntry } from "@/lib/types";

interface HeaderProps {
  onHistoryRestore?: (entry: OptimizationEntry) => void;
  historyRefreshTrigger?: number;
}

export function Header({ onHistoryRestore, historyRefreshTrigger }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">
              PromptOptimizer
            </h1>
            <p className="text-[10px] text-muted-foreground/50 -mt-0.5 hidden sm:block">
              No API key needed · Just paste &amp; optimize
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <HistoryPanel
            onRestore={onHistoryRestore}
            refreshTrigger={historyRefreshTrigger}
          />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
