"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ParticleField } from "@/components/ParticleField";
import { TypewriterText } from "@/components/TypewriterText";
import { TiltCard } from "@/components/TiltCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import { Sparkles, Zap, Brain, Shield, ChevronRight, ArrowRight, Terminal, Layers, BarChart3, Lock, Globe, Cpu } from "lucide-react";
import { useSession } from "next-auth/react";

// Lazy-load 3D scene (heavy) — only on landing page
const HeroScene3D = dynamic(
  () => import("@/components/HeroScene3D").then((mod) => ({ default: mod.HeroScene3D })),
  { ssr: false }
);

const HERO_PHRASES = [
  "Transform vague prompts into precision-engineered instructions",
  "14 domain-specific optimization engines",
  "Real-time scoring • Smart rewrite • Zero API keys",
  "Professional-grade prompt engineering, instantly",
];

export default function LandingPage() {
  const { status } = useSession();

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col noise-overlay">
      {/* Particle Background */}
      <div className="fixed inset-0 z-0">
        <ParticleField particleCount={60} connectionDistance={100} />
      </div>

      {/* ═══ NAVBAR ═══ */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg border border-primary/40 bg-primary/10 flex items-center justify-center animate-pulse-neon shadow-[0_0_15px_var(--primary)]">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="font-bold tracking-tight text-lg gradient-text-static uppercase">
            Prompt Optimizer
          </span>
        </div>
        <nav className="flex items-center gap-3">
          {status === "authenticated" ? (
            <Link href="/optimizer">
              <Button className="btn-3d bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold shadow-[0_0_20px_var(--primary)_inset]">
                Open Optimizer
                <ArrowRight className="h-4 w-4" />
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
                <Button className="btn-3d bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_20px_var(--primary)_inset]">
                  Get Started
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative z-10 flex flex-col items-center justify-center px-4 pt-16 pb-24 text-center min-h-[85vh]">
        {/* 3D Scene behind hero text */}
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <HeroScene3D />
        </div>

        <div className="relative z-10 space-y-8 max-w-5xl mx-auto">
          {/* Badge */}
          <ScrollReveal variant="fadeIn" delay={0}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-primary/80 uppercase tracking-wider">
                Now with 14 domain engines
              </span>
            </div>
          </ScrollReveal>

          {/* Main heading */}
          <ScrollReveal variant="blur" delay={0.1}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9]">
              <span className="gradient-text">Engineer</span>
              <br />
              <span className="text-foreground">Perfect Prompts</span>
            </h1>
          </ScrollReveal>

          {/* Typewriter subtitle */}
          <ScrollReveal variant="fadeUp" delay={0.3}>
            <div className="text-muted-foreground text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed h-16 flex items-center justify-center">
              <TypewriterText
                phrases={HERO_PHRASES}
                typingSpeed={40}
                deletingSpeed={20}
                pauseDuration={2500}
              />
            </div>
          </ScrollReveal>

          {/* CTA Buttons */}
          <ScrollReveal variant="fadeUp" delay={0.5}>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href={status === "authenticated" ? "/optimizer" : "/register"}>
                <Button
                  size="lg"
                  className="btn-3d h-14 px-10 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground group animate-glow-pulse"
                >
                  Start Optimizing — Free
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="btn-3d h-14 px-10 text-base font-semibold border-primary/20 hover:bg-primary/5 hover:border-primary/40"
                >
                  <Terminal className="mr-2 h-5 w-5 text-primary/60" />
                  Sign In
                </Button>
              </Link>
            </div>
          </ScrollReveal>

          {/* Stats bar */}
          <ScrollReveal variant="fadeUp" delay={0.7}>
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-muted-foreground/60">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary/50" />
                <span className="font-mono">
                  <AnimatedCounter target={14} className="font-bold text-foreground" /> domains
                </span>
              </div>
              <div className="w-px h-4 bg-border/30" />
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary/50" />
                <span className="font-mono">100% private</span>
              </div>
              <div className="w-px h-4 bg-border/30" />
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary/50" />
                <span className="font-mono">No API key needed</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ FEATURES SECTION ═══ */}
      <section className="relative z-10 px-4 py-24 max-w-7xl mx-auto w-full">
        <ScrollReveal variant="fadeUp">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              <span className="gradient-text-static">Professional-Grade</span> Features
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">
              Everything you need to transform raw prompts into optimized instructions
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.15}>
          <StaggerItem>
            <TiltCard className="h-full">
              <div className="cyber-panel-premium p-8 text-left space-y-5 h-full">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 animate-glow-pulse">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Instant Scoring</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Real-time heuristic analysis scores your prompt across 4 dimensions — clarity, specificity, structure, and completeness — before you even hit optimize.
                </p>
                <div className="flex items-center gap-2 text-xs text-primary/60 font-mono pt-2">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Live dimension bars
                </div>
              </div>
            </TiltCard>
          </StaggerItem>

          <StaggerItem>
            <TiltCard className="h-full">
              <div className="cyber-panel-premium p-8 text-left space-y-5 h-full">
                <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20" style={{ animation: "glow-pulse-secondary 3s ease-in-out infinite" }}>
                  <Brain className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold">Smart Rewrite</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our advanced rule-based engine detects your domain, injects best practices, adds structure, and removes noise — all without sending data to any API.
                </p>
                <div className="flex items-center gap-2 text-xs text-secondary/60 font-mono pt-2">
                  <Layers className="h-3.5 w-3.5" />
                  14 domain engines
                </div>
              </div>
            </TiltCard>
          </StaggerItem>

          <StaggerItem>
            <TiltCard className="h-full">
              <div className="cyber-panel-premium p-8 text-left space-y-5 h-full">
                <div className="h-12 w-12 rounded-xl bg-chart-3/10 flex items-center justify-center border border-chart-3/20">
                  <Shield className="h-6 w-6 text-chart-3" />
                </div>
                <h3 className="text-xl font-bold">Private &amp; Secure</h3>
                <p className="text-muted-foreground leading-relaxed">
                  All optimization runs on-device. Your prompts never leave your browser. Optional account sync with encrypted MongoDB storage for your history.
                </p>
                <div className="flex items-center gap-2 text-xs text-chart-3/60 font-mono pt-2">
                  <Lock className="h-3.5 w-3.5" />
                  Zero data collection
                </div>
              </div>
            </TiltCard>
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="relative z-10 px-4 py-24 border-t border-border/5">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal variant="fadeUp">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                How It <span className="gradient-text-static">Works</span>
              </h2>
              <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">
                Three steps to a perfectly engineered prompt
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection lines (desktop only) */}
            <div className="hidden md:block absolute top-1/2 left-[33%] right-[33%] h-px">
              <div className="absolute left-0 right-[50%] h-px bg-gradient-to-r from-primary/30 to-secondary/30" style={{ top: 0 }} />
              <div className="absolute left-[50%] right-0 h-px bg-gradient-to-r from-secondary/30 to-primary/30" style={{ top: 0 }} />
            </div>

            <ScrollReveal variant="fadeUp" delay={0}>
              <div className="text-center space-y-4 relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto animate-glow-pulse">
                  <span className="text-2xl font-black gradient-text">01</span>
                </div>
                <h3 className="text-lg font-bold">Paste Your Prompt</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Drop any raw prompt — from a one-liner to a complex multi-turn instruction set. No formatting required.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={0.15}>
              <div className="text-center space-y-4 relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/20 mx-auto" style={{ animation: "glow-pulse-secondary 3s ease-in-out infinite" }}>
                  <span className="text-2xl font-black gradient-text-static">02</span>
                </div>
                <h3 className="text-lg font-bold">Instant Analysis</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Our heuristic engine scores your prompt across 4 dimensions while the rule-based rewriter restructures it in real-time.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={0.3}>
              <div className="text-center space-y-4 relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto animate-glow-pulse">
                  <span className="text-2xl font-black gradient-text">03</span>
                </div>
                <h3 className="text-lg font-bold">Copy &amp; Use</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Review the diff, check score improvements, and copy the optimized prompt. Use it with ChatGPT, Gemini, Claude, or any LLM.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ STATS SECTION ═══ */}
      <section className="relative z-10 px-4 py-20">
        <ScrollReveal variant="scale">
          <div className="max-w-4xl mx-auto cyber-panel-premium p-10 sm:p-14">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl font-black gradient-text">
                  <AnimatedCounter target={14} />
                </div>
                <p className="text-sm text-muted-foreground font-mono">Domains</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl font-black gradient-text-static">
                  <AnimatedCounter target={4} />
                </div>
                <p className="text-sm text-muted-foreground font-mono">Score Dimensions</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl font-black gradient-text">
                  <AnimatedCounter target={8} />
                </div>
                <p className="text-sm text-muted-foreground font-mono">Templates</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl font-black gradient-text-static">
                  <AnimatedCounter target={0} suffix=" ms" prefix="~" />
                </div>
                <p className="text-sm text-muted-foreground font-mono">Data Shared</p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative z-10 px-4 py-24">
        <ScrollReveal variant="fadeUp">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Ready to <span className="gradient-text">Level Up</span> Your Prompts?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Join the optimization workflow used by developers, writers, and AI engineers.
              Free. Private. No API key required.
            </p>
            <Link href={status === "authenticated" ? "/optimizer" : "/register"}>
              <Button
                size="lg"
                className="btn-3d h-16 px-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground group animate-glow-pulse mt-4"
              >
                Start Optimizing — It&apos;s Free
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-border/10 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded border border-primary/30 bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground/50">
              © 2026 Prompt Optimizer
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground/40">
            <span>Built for SDE III Standards</span>
            <span className="w-px h-3 bg-border/20" />
            <span>100% On-Device</span>
            <span className="w-px h-3 bg-border/20" />
            <span>Next.js 16</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
