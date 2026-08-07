"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CursorGlow } from "@/components/CursorGlow";
import { Sparkles, Zap, Brain, Shield, ChevronRight, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function LandingPage() {
  const { status } = useSession();

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col">
      <CursorGlow />

      {/* Navbar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded border border-primary bg-primary/10 flex items-center justify-center animate-pulse-neon shadow-[0_0_10px_var(--primary)]">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold tracking-tight text-primary uppercase">Prompt Optimizer</span>
        </div>
        <nav className="flex items-center gap-4">
          {status === "authenticated" ? (
            <Link href="/optimizer">
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                Go to Optimizer
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_var(--primary)_inset]">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-4 py-20 text-center max-w-5xl mx-auto w-full">
        <div className="space-y-6">
          <div className="glitch-wrapper mb-4">
            <h1 
              className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase glitch-text" 
              data-text="ENGINEER PERFECT PROMPTS"
            >
              ENGINEER PERFECT PROMPTS
            </h1>
          </div>
          
          <p className="text-muted-foreground text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed">
            Elevate your AI interactions with industry-grade prompt optimization. 
            Transform vague requests into highly structured, context-rich instructions instantly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-8 animate-fade-in-up">
            <Link href={status === "authenticated" ? "/optimizer" : "/register"}>
              <Button size="lg" className="h-14 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground group">
                Get Started for Free
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold border-primary/20 hover:bg-primary/5">
                Sign In to Your Account
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-32 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="cyber-panel p-6 text-left space-y-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Instant Scoring</h3>
            <p className="text-muted-foreground leading-relaxed">
              Real-time heuristic analysis scores your prompt on clarity, specificity, structure, and completeness before you even optimize.
            </p>
          </div>

          <div className="cyber-panel p-6 text-left space-y-4">
            <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold">Smart Rewrite</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our advanced rule-based engine automatically structures your prompt, injecting best practices and domain-specific optimizations.
            </p>
          </div>

          <div className="cyber-panel p-6 text-left space-y-4">
            <div className="h-10 w-10 rounded-full bg-chart-3/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-chart-3" />
            </div>
            <h3 className="text-xl font-semibold">Private History</h3>
            <p className="text-muted-foreground leading-relaxed">
              Securely store and retrieve your best performing prompts. Your data is privately synced to your account using MongoDB.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/10 py-8 text-center text-sm text-muted-foreground/50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <p>© 2026 Prompt Optimizer. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Built for SDE III Standards</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
