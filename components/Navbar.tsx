"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronRight, ArrowRight, Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";

const NAV_SECTIONS = [
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How It Works" },
  { id: "stats", label: "Stats" },
  { id: "contact", label: "Contact" },
];

interface NavbarProps {
  /** If true, renders section scroll links (landing page). If false, only top-level links. */
  showSections?: boolean;
}

export function Navbar({ showSections = true }: NavbarProps) {
  const { status } = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Track scroll position for glassmorphism intensity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    if (!showSections) return;

    const observers: IntersectionObserver[] = [];
    const sectionIds = NAV_SECTIONS.map((s) => s.id);

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        { rootMargin: "-40% 0px -55% 0px" }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, [showSections]);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileOpen(false);
    }
  }, []);

  const isLanding = pathname === "/";

  return (
    <nav className={`glass-navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* ─── Logo ─── */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-8 w-8 rounded-lg border border-primary/40 bg-primary/10 flex items-center justify-center animate-pulse-neon shadow-[0_0_15px_var(--primary)] group-hover:scale-110 transition-transform">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold tracking-tight text-base gradient-text-static uppercase hidden sm:inline">
            Prompt Optimizer
          </span>
        </Link>

        {/* ─── Desktop Nav Links ─── */}
        <div className="hidden md:flex items-center gap-1">
          {showSections && isLanding &&
            NAV_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`nav-link ${activeSection === section.id ? "active" : ""}`}
              >
                {section.label}
              </button>
            ))}
          <Link
            href="/updates"
            className={`nav-link ${pathname === "/updates" ? "active" : ""}`}
          >
            Updates
          </Link>
        </div>

        {/* ─── Auth Buttons (Desktop) ─── */}
        <div className="hidden md:flex items-center gap-3">
          {status === "authenticated" ? (
            <Link href="/optimizer">
              <Button className="btn-3d bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold shadow-[0_0_20px_var(--primary)_inset] text-sm h-9">
                Open Optimizer
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm h-9">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="btn-3d bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_20px_var(--primary)_inset] text-sm h-9">
                  Get Started
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* ─── Mobile Hamburger ─── */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? (
            <X className="h-5 w-5 text-foreground" />
          ) : (
            <Menu className="h-5 w-5 text-foreground" />
          )}
        </button>
      </div>

      {/* ─── Mobile Dropdown ─── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 px-6 py-4 space-y-2 animate-fade-in-down">
          {showSections && isLanding &&
            NAV_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`nav-link block w-full text-left ${activeSection === section.id ? "active" : ""}`}
              >
                {section.label}
              </button>
            ))}
          <Link
            href="/updates"
            className={`nav-link block ${pathname === "/updates" ? "active" : ""}`}
            onClick={() => setMobileOpen(false)}
          >
            Updates
          </Link>

          <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
            {status === "authenticated" ? (
              <Link href="/optimizer" onClick={() => setMobileOpen(false)}>
                <Button className="w-full btn-3d bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold">
                  Open Optimizer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
                    Login
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full btn-3d bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    Get Started
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
