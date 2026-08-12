"use client";

import { Navbar } from "@/components/Navbar";
import { ParticleField } from "@/components/ParticleField";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import { FooterSection } from "@/components/FooterSection";
import { Sparkles, Rocket, Paintbrush, Cpu, Wrench, ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";

/* ─── Update Entries ───────────────────────────────────────────────────── */

interface UpdateEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  highlights: string[];
  icon: React.ReactNode;
  accent: "primary" | "secondary" | "chart-3";
}

const UPDATES: UpdateEntry[] = [
  {
    version: "v0.3",
    date: "August 12, 2026",
    title: "Glassmorphic Navigation & Contact Footer",
    description:
      "Introduced a premium frosted-glass navbar with smooth scroll navigation, active section tracking, and mobile responsiveness. Added a comprehensive footer with Contact Us, expandable legal sections, and developer social links.",
    highlights: [
      "Glassmorphic sticky navbar with backdrop blur",
      "Smooth scroll to page sections with active highlighting",
      "Contact Us, Terms, FAQ & Privacy accordion",
      "Developer LinkedIn & GitHub social links",
      "Updates blog page (you're looking at it!)",
    ],
    icon: <Paintbrush className="h-5 w-5" />,
    accent: "secondary",
  },
  {
    version: "v0.2",
    date: "August 11, 2026",
    title: "Premium Landing Page Redesign",
    description:
      "Complete overhaul of the landing page with 3D hero scene, particle field background, animated counters, tilt cards, scroll reveal animations, and a fully redesigned optimizer dashboard.",
    highlights: [
      "3D animated hero scene with Three.js",
      "Interactive particle field background",
      "Premium cyber-panel glassmorphism cards",
      "Animated score cards with delta indicators",
      "Redesigned optimizer sidebar & diff view",
      "Auth flow aesthetic upgrade",
    ],
    icon: <Rocket className="h-5 w-5" />,
    accent: "primary",
  },
  {
    version: "v0.1",
    date: "August 3, 2026",
    title: "14 Domain Engines & Core Launch",
    description:
      "Initial release of the prompt optimization engine with 14 domain-specific rewriting strategies, 4-dimension heuristic scoring, prompt templates, and full client-side processing.",
    highlights: [
      "14 domain engines (code, data, security, design, product, education, legal, marketing, research, writing, finance, medical, creative, devops)",
      "4-dimension heuristic scoring (clarity, specificity, structure, completeness)",
      "8 built-in prompt templates",
      "Rule-based rewriter — zero API keys needed",
      "Client-side scoring — 100% private",
      "Auth + MongoDB history sync (opt-in)",
    ],
    icon: <Cpu className="h-5 w-5" />,
    accent: "chart-3",
  },
];

/* ─── Accent Color Helpers ─────────────────────────────────────────────── */

function getAccentClasses(accent: UpdateEntry["accent"]) {
  switch (accent) {
    case "primary":
      return {
        iconBg: "bg-primary/10 border-primary/20",
        iconText: "text-primary",
        tagBorder: "border-primary/30",
        tagBg: "bg-primary/10",
        tagText: "text-primary",
        dotGlow: "shadow-[0_0_8px_var(--primary)]",
      };
    case "secondary":
      return {
        iconBg: "bg-secondary/10 border-secondary/20",
        iconText: "text-secondary",
        tagBorder: "border-secondary/30",
        tagBg: "bg-secondary/10",
        tagText: "text-secondary",
        dotGlow: "shadow-[0_0_8px_var(--secondary)]",
      };
    case "chart-3":
      return {
        iconBg: "bg-chart-3/10 border-chart-3/20",
        iconText: "text-chart-3",
        tagBorder: "border-chart-3/30",
        tagBg: "bg-chart-3/10",
        tagText: "text-chart-3",
        dotGlow: "",
      };
  }
}

/* ─── Page Component ───────────────────────────────────────────────────── */

export default function UpdatesPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col noise-overlay">
      {/* Particle Background */}
      <div className="fixed inset-0 z-0">
        <ParticleField particleCount={40} connectionDistance={80} />
      </div>

      <Navbar showSections={false} />

      {/* Spacer for fixed navbar */}
      <div className="h-16" />

      {/* ─── Hero ─── */}
      <section className="relative z-10 px-4 pt-20 pb-12 text-center">
        <ScrollReveal variant="blur">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary/80 uppercase tracking-wider">
                Changelog
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[0.95]">
              <span className="gradient-text">Product</span>{" "}
              <span className="text-foreground">Updates</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
              Follow our journey as we ship new features, improvements, and domain engines. Every update is designed to make your prompt engineering workflow faster and smarter.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── Timeline ─── */}
      <section className="relative z-10 px-4 pb-24">
        <div className="max-w-3xl mx-auto relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[1.45rem] top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-secondary/20 to-transparent hidden md:block" />

          <StaggerContainer className="space-y-8" staggerDelay={0.15}>
            {UPDATES.map((update, index) => {
              const colors = getAccentClasses(update.accent);
              return (
                <StaggerItem key={update.version}>
                  <div className="flex gap-6 items-start">
                    {/* Timeline dot (desktop) */}
                    <div className="hidden md:flex flex-col items-center pt-2">
                      <div className={`h-3 w-3 rounded-full ${colors.iconBg} border ${colors.dotGlow}`} />
                    </div>

                    {/* Card */}
                    <div className="update-card flex-1">
                      {/* Header row */}
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`version-tag ${colors.tagBorder} ${colors.tagBg} ${colors.tagText}`}>
                          {update.version}
                        </span>
                        <span className="date-tag">{update.date}</span>
                      </div>

                      {/* Icon + Title */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`h-11 w-11 shrink-0 rounded-xl ${colors.iconBg} border flex items-center justify-center`}>
                          <span className={colors.iconText}>{update.icon}</span>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold tracking-tight">{update.title}</h2>
                          <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
                            {update.description}
                          </p>
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="ml-0 md:ml-[3.75rem] space-y-2">
                        {update.highlights.map((highlight, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <Zap className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${colors.iconText} opacity-50`} />
                            <span className="text-sm text-muted-foreground/80">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

          {/* Back to home */}
          <ScrollReveal variant="fadeUp" delay={0.3}>
            <div className="text-center mt-16">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}
