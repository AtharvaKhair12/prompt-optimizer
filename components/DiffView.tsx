"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, ArrowRight, FileText } from "lucide-react";
import { diffWords } from "diff";

interface DiffViewProps {
  original: string;
  optimized: string;
  techniques: string[];
  rationale: string;
}

export function DiffView({ original, optimized, techniques, rationale }: DiffViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(optimized);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const changes = diffWords(original, optimized);

  const originalWords = original.trim().split(/\s+/).filter(Boolean).length;
  const optimizedWords = optimized.trim().split(/\s+/).filter(Boolean).length;
  const wordDelta = optimizedWords - originalWords;

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Techniques applied */}
      {techniques.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {techniques.map((technique, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 text-xs"
            >
              {technique}
            </Badge>
          ))}
        </div>
      )}

      {/* Rationale */}
      {rationale && (
        <p className="text-sm text-muted-foreground/80 leading-relaxed italic border-l-2 border-primary/30 pl-3">
          {rationale}
        </p>
      )}

      {/* Tabs + copy */}
      <Tabs defaultValue="optimized" className="w-full">
        <div className="flex items-center justify-between gap-2">
          <TabsList className="bg-muted/30">
            <TabsTrigger value="optimized" className="text-xs">
              Optimized
            </TabsTrigger>
            <TabsTrigger value="diff" className="text-xs">
              Diff View
            </TabsTrigger>
            <TabsTrigger value="sidebyside" className="text-xs hidden sm:inline-flex">
              Side by Side
            </TabsTrigger>
          </TabsList>

          {/* Copy button — prominent */}
          <Button
            id="copy-optimized"
            variant={copied ? "secondary" : "default"}
            size="sm"
            onClick={handleCopy}
            className={`gap-2 font-semibold transition-all duration-200 ${
              copied
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                : "bg-primary/90 hover:bg-primary text-primary-foreground"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>

        {/* Word count stats */}
        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground/40">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {optimizedWords} words
          </span>
          {wordDelta !== 0 && (
            <span className={wordDelta > 0 ? "text-primary/50" : "text-muted-foreground/40"}>
              {wordDelta > 0 ? `+${wordDelta}` : wordDelta} vs original
            </span>
          )}
        </div>

        <TabsContent value="optimized" className="mt-3">
          <Card className="cyber-panel font-mono">
            <CardContent className="p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{optimized}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diff" className="mt-3">
          <Card className="cyber-panel font-mono">
            <CardContent className="p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {changes.map((part, i) => {
                  if (part.added) {
                    return (
                      <span key={i} className="diff-added">
                        {part.value}
                      </span>
                    );
                  }
                  if (part.removed) {
                    return (
                      <span key={i} className="diff-removed">
                        {part.value}
                      </span>
                    );
                  }
                  return <span key={i}>{part.value}</span>;
                })}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sidebyside" className="mt-3">
          <div className="grid grid-cols-2 gap-3">
            <Card className="cyber-panel font-mono">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-muted-foreground/60 font-normal uppercase tracking-wider">
                  Original
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground/70">
                  {original}
                </p>
              </CardContent>
            </Card>

            <Card className="cyber-panel font-mono border-primary/50 shadow-[0_0_15px_var(--primary)]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-primary/60 font-normal uppercase tracking-wider flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  Optimized
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{optimized}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function DiffViewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-6 w-24 animate-shimmer rounded-full" />
        ))}
      </div>
      <div className="h-4 w-3/4 animate-shimmer rounded" />
      <div className="h-32 animate-shimmer rounded-lg" />
    </div>
  );
}
