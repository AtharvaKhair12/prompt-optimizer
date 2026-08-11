"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [activeTab, setActiveTab] = useState("optimized");

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      {/* Techniques applied — staggered pop-in */}
      {techniques.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {techniques.map((technique, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 20 }}
            >
              <Badge
                variant="secondary"
                className="bg-primary/8 text-primary border-primary/15 text-xs hover:bg-primary/15 transition-colors"
              >
                {technique}
              </Badge>
            </motion.div>
          ))}
        </div>
      )}

      {/* Rationale */}
      {rationale && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-muted-foreground/70 leading-relaxed italic border-l-2 border-primary/30 pl-3"
        >
          {rationale}
        </motion.p>
      )}

      {/* Tabs + copy */}
      <Tabs defaultValue="optimized" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-2">
          <TabsList className="bg-muted/20 backdrop-blur-sm">
            <TabsTrigger value="optimized" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              Optimized
            </TabsTrigger>
            <TabsTrigger value="diff" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              Diff View
            </TabsTrigger>
            <TabsTrigger value="sidebyside" className="text-xs hidden sm:inline-flex data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              Side by Side
            </TabsTrigger>
          </TabsList>

          {/* Copy button */}
          <Button
            id="copy-optimized"
            variant={copied ? "secondary" : "default"}
            size="sm"
            onClick={handleCopy}
            className={`gap-2 font-semibold transition-all duration-300 btn-3d ${
              copied
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25 shadow-[0_0_15px_oklch(0.7_0.18_155_/_0.2)]"
                : "bg-primary/90 hover:bg-primary text-primary-foreground shadow-[0_0_15px_var(--primary)_inset]"
            }`}
          >
            {copied ? (
              <>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                  <Check className="h-3.5 w-3.5" />
                </motion.div>
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

        <AnimatePresence mode="wait">
          <TabsContent value="optimized" className="mt-3" key="tab-optimized">
            <motion.div
              key="optimized"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="cyber-panel-premium font-mono border-0">
                <CardContent className="p-5">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{optimized}</p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="diff" className="mt-3" key="tab-diff">
            <motion.div
              key="diff"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="cyber-panel-premium font-mono border-0">
                <CardContent className="p-5">
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
            </motion.div>
          </TabsContent>

          <TabsContent value="sidebyside" className="mt-3" key="tab-sidebyside">
            <motion.div
              key="sidebyside"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-2 gap-3">
                <Card className="cyber-panel font-mono">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs text-muted-foreground/50 font-normal uppercase tracking-wider">
                      Original
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground/60">
                      {original}
                    </p>
                  </CardContent>
                </Card>

                <Card className="cyber-panel-premium font-mono border-0">
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
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </motion.div>
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
      <div className="h-40 animate-shimmer rounded-xl" />
    </div>
  );
}
