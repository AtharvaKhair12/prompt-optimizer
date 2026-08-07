"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, Clock, Inbox, ChevronRight, Lightbulb, History, Sparkles, PanelLeftClose, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import type { OptimizationEntry } from "@/lib/types";
import { AuthButton } from "./AuthButton";

const LOCALSTORAGE_HISTORY_KEY = "promptopt_history";
const MAX_LOCAL_ENTRIES = 50;

export interface Template {
  label: string;
  emoji: string;
  text: string;
}

export const TEMPLATES: Template[] = [
  { label: "Code Review", emoji: "💻", text: "Review this code and suggest improvements:\n\n```\n// paste your code here\n```" },
  { label: "Email Writer", emoji: "✉️", text: "Write a professional email to [recipient] about [topic]. The tone should be [formal/friendly]. Key points to cover: [point 1], [point 2]." },
  { label: "Explain Concept", emoji: "🎓", text: "Explain [concept] to someone with [beginner/intermediate] knowledge of [field]. Use a real-world analogy and a concrete example." },
  { label: "Data Analysis", emoji: "📊", text: "Analyze the following dataset and identify the top 3 insights:\n\n[paste data or describe it here]\n\nFocus on: trends, outliers, and actionable recommendations." },
  { label: "Debug Issue", emoji: "🔍", text: "I'm getting this error:\n\n```\n[error message]\n```\n\nHere is the relevant code:\n\n```\n[code]\n```\n\nWhat is causing it and how do I fix it?" },
  { label: "Product PRD", emoji: "📋", text: "Write a PRD for a feature that lets users [goal]. Target users: [persona]. Success metric: [metric]. Constraints: [any constraints]." },
  { label: "Marketing Copy", emoji: "📣", text: "Write compelling marketing copy for [product/service]. Target audience: [audience]. Key benefit: [benefit]. Tone: [tone]. Format: [landing page headline / email subject / ad copy]." },
  { label: "Research Summary", emoji: "🔬", text: "Summarize the current state of research on [topic]. Cover: key findings, leading methodologies, open questions, and practical implications for [field/use case]." },
];

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onNewChat?: () => void;
  onRestore?: (entry: OptimizationEntry) => void;
  onTemplateSelect?: (text: string) => void;
  refreshTrigger?: number;
}

export function Sidebar({ isOpen = true, onToggle, onNewChat, onRestore, onTemplateSelect, refreshTrigger }: SidebarProps) {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<OptimizationEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    if (session?.user) {
      try {
        const res = await fetch("/api/history");
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
        }
      } catch {
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
      if (stored) setEntries(JSON.parse(stored));
    } catch {
      setEntries([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [loadHistory, refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (session?.user) {
      try {
        await fetch("/api/history", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      } catch {}
    }
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    if (!session?.user) {
      localStorage.setItem(LOCALSTORAGE_HISTORY_KEY, JSON.stringify(updated));
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getOverallScore = (entry: OptimizationEntry) => {
    const s = entry.scores;
    return Math.round((s.clarity * 0.3 + s.specificity * 0.25 + s.structure * 0.25 + s.completeness * 0.2) * 10) / 10;
  };

  if (!isOpen) return null;

  return (
    <aside className="w-80 h-full border-r border-primary/20 bg-black/40 flex flex-col backdrop-blur-md shrink-0 z-10 relative overflow-hidden transition-all duration-300">
      <div className="p-4 flex flex-col gap-4 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded border border-primary bg-primary/10 flex items-center justify-center animate-pulse-neon shadow-[0_0_10px_var(--primary)]">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight uppercase text-primary">
                Optimizer
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <p className="text-[9px] font-mono text-secondary tracking-widest uppercase">SYS.ONLINE</p>
            </div>
          </div>
          </div>
          <div className="flex items-center gap-2">
            <AuthButton />
            {onToggle && (
              <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8 text-muted-foreground hover:text-primary">
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* New Chat Button */}
        {onNewChat && (
          <Button 
            onClick={onNewChat} 
            className="w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_var(--primary)_inset]"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Templates Section */}
          <section>
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50 mb-3 flex items-center gap-2">
              <Lightbulb className="h-3 w-3" /> Templates
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  onClick={() => onTemplateSelect?.(tpl.text)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded border border-primary/10 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 transition-all text-left group"
                >
                  <span className="text-base leading-none">{tpl.emoji}</span>
                  <span className="text-xs text-muted-foreground/80 group-hover:text-foreground transition-colors truncate">
                    {tpl.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <Separator className="bg-primary/10" />

          {/* History Section */}
          <section>
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50 mb-3 flex items-center gap-2">
              <History className="h-3 w-3" /> History
            </h2>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 space-y-2 border border-primary/10 rounded">
                    <div className="h-3 w-3/4 animate-shimmer rounded bg-primary/10" />
                    <div className="h-2 w-1/2 animate-shimmer rounded bg-primary/5" />
                  </div>
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-primary/20 rounded">
                <Inbox className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground/50">No history yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group p-3 rounded border border-primary/10 bg-black/40 hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => onRestore?.(entry)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground/90 truncate font-mono">
                          {entry.originalPrompt.length > 50 ? entry.originalPrompt.slice(0, 50) + "…" : entry.originalPrompt}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground/40" />
                          <span className="text-[10px] text-muted-foreground/50 font-mono">
                            {formatTime(entry.createdAt)}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-semibold tabular-nums ${
                              getOverallScore(entry) > 6 ? "score-high" : getOverallScore(entry) > 3 ? "score-mid" : "score-low"
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
                          className="h-6 w-6 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(entry.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </aside>
  );
}

export function saveToLocalHistory(entry: OptimizationEntry) {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_HISTORY_KEY);
    const entries: OptimizationEntry[] = stored ? JSON.parse(stored) : [];
    entries.unshift(entry);
    const trimmed = entries.slice(0, MAX_LOCAL_ENTRIES);
    localStorage.setItem(LOCALSTORAGE_HISTORY_KEY, JSON.stringify(trimmed));
  } catch {}
}
