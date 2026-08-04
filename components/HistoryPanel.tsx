"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { History, Trash2, Clock, ChevronRight, Inbox } from "lucide-react";
import { useSession } from "next-auth/react";
import type { OptimizationEntry } from "@/lib/types";

const LOCALSTORAGE_HISTORY_KEY = "promptopt_history";
const MAX_LOCAL_ENTRIES = 50;

interface HistoryPanelProps {
  onRestore?: (entry: OptimizationEntry) => void;
  refreshTrigger?: number;
}

export function HistoryPanel({ onRestore, refreshTrigger }: HistoryPanelProps) {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<OptimizationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);

    if (session?.user) {
      // Signed in → fetch from server
      try {
        const res = await fetch("/api/history");
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
        }
      } catch {
        // Fall back to localStorage
        loadLocalHistory();
      }
    } else {
      loadLocalHistory();
    }

    setLoading(false);
  }, [session]);

  const loadLocalHistory = () => {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_HISTORY_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch {
      setEntries([]);
    }
  };

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, loadHistory, refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (session?.user) {
      try {
        await fetch("/api/history", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      } catch {
        // Non-fatal
      }
    }

    // Also remove from localStorage
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);

    if (!session?.user) {
      localStorage.setItem(LOCALSTORAGE_HISTORY_KEY, JSON.stringify(updated));
    }
  };

  const handleRestore = (entry: OptimizationEntry) => {
    onRestore?.(entry);
    setOpen(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncate = (text: string, length: number) => {
    if (text.length <= length) return text;
    return text.slice(0, length) + "…";
  };

  const getOverallScore = (entry: OptimizationEntry) => {
    const s = entry.scores;
    return Math.round(
      (s.clarity * 0.3 + s.specificity * 0.25 + s.structure * 0.25 + s.completeness * 0.2) * 10
    ) / 10;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            id="history-button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground/60 hover:text-foreground relative"
          >
            <History className="h-4 w-4" />
            {entries.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full" />
            )}
          </Button>
        }
      />

      <SheetContent className="glass w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <History className="h-4 w-4 text-primary" />
            History
            {entries.length > 0 && (
              <span className="text-xs text-muted-foreground/50 font-normal">
                ({entries.length})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <Separator className="opacity-30" />

        <ScrollArea className="h-[calc(100vh-80px)]">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 space-y-2">
                  <div className="h-4 w-3/4 animate-shimmer rounded" />
                  <div className="h-3 w-1/2 animate-shimmer rounded" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground/50">No history yet</p>
              <p className="text-xs text-muted-foreground/30 mt-1">
                Your optimized prompts will appear here
              </p>
            </div>
          ) : (
            <div className="p-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="group p-3 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => handleRestore(entry)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/90 truncate">
                        {truncate(entry.originalPrompt, 80)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-xs text-muted-foreground/40">
                          {formatTime(entry.createdAt)}
                        </span>
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            getOverallScore(entry) > 6
                              ? "score-high"
                              : getOverallScore(entry) > 3
                                ? "score-mid"
                                : "score-low"
                          }`}
                        >
                          {getOverallScore(entry)}/10
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/50 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(entry.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Save an optimization entry to localStorage (for anonymous users).
 */
export function saveToLocalHistory(entry: OptimizationEntry) {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_HISTORY_KEY);
    const entries: OptimizationEntry[] = stored ? JSON.parse(stored) : [];
    entries.unshift(entry);
    // Keep only the most recent entries
    const trimmed = entries.slice(0, MAX_LOCAL_ENTRIES);
    localStorage.setItem(LOCALSTORAGE_HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // Non-fatal
  }
}
