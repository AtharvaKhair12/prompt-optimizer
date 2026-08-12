"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, Mail, MapPin, Heart, ExternalLink, Shield, HelpCircle, FileText } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

/* ─── Brand SVG Icons (not available in lucide-react) ──────────────────── */

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/* ─── Legal Accordion Item ─────────────────────────────────────────────── */

interface AccordionItemProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function AccordionItem({ icon, title, children }: AccordionItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="legal-accordion">
      <button
        className="legal-accordion-trigger"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{title}</span>
        </div>
        <ChevronDown className="chevron h-4 w-4" />
      </button>
      <div className={`legal-accordion-content ${expanded ? "expanded" : ""}`}>
        <div className="legal-accordion-inner">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Footer Section ───────────────────────────────────────────────────── */

export function FooterSection() {
  return (
    <footer id="contact" className="relative z-10 border-t border-border/10 mt-auto">
      {/* ─── Contact Us ─── */}
      <section className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal variant="fadeUp">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Get In <span className="gradient-text-static">Touch</span>
              </h2>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
                We&apos;re not just developers — we&apos;re a complete product team delivering end-to-end solutions, from concept and architecture to seamless user experiences that delight.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp" delay={0.15}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
              <div className="cyber-panel p-6 text-center space-y-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 mx-auto">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">Product Inquiries</h3>
                <p className="text-xs text-muted-foreground">Reach out for partnerships, integrations, and enterprise solutions.</p>
              </div>
              <div className="cyber-panel p-6 text-center space-y-3">
                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center border border-secondary/20 mx-auto">
                  <MapPin className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="text-sm font-semibold">Built Globally</h3>
                <p className="text-xs text-muted-foreground">Remote-first team crafting tools for developers worldwide.</p>
              </div>
              <div className="cyber-panel p-6 text-center space-y-3">
                <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center border border-chart-3/20 mx-auto">
                  <Heart className="h-5 w-5 text-chart-3" />
                </div>
                <h3 className="text-sm font-semibold">Open Source</h3>
                <p className="text-xs text-muted-foreground">Community-driven development. Contributions always welcome.</p>
              </div>
            </div>
          </ScrollReveal>

          {/* ─── Legals Accordion ─── */}
          <ScrollReveal variant="fadeUp" delay={0.25}>
            <div className="max-w-3xl mx-auto space-y-3">
              <AccordionItem
                icon={<FileText className="h-4 w-4 text-primary/60" />}
                title="Terms of Service"
              >
                <div className="space-y-3 pt-2">
                  <p>
                    By accessing and using Prompt Optimizer (&quot;the Service&quot;), you agree to be bound by these Terms of Service. The Service is provided &quot;as-is&quot; without warranties of any kind, either express or implied.
                  </p>
                  <h4>Usage</h4>
                  <p>
                    You may use the Service for lawful purposes only. You retain full ownership of any prompts you input and any optimized outputs generated. We claim no rights over your content.
                  </p>
                  <h4>Intellectual Property</h4>
                  <p>
                    The Service, its original content, features, and functionality are owned by the Prompt Optimizer team and are protected by international copyright, trademark, and other intellectual property laws.
                  </p>
                  <h4>Limitation of Liability</h4>
                  <p>
                    In no event shall Prompt Optimizer, its directors, employees, or partners be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
                  </p>
                  <h4>Modifications</h4>
                  <p>
                    We reserve the right to modify or replace these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
                  </p>
                </div>
              </AccordionItem>

              <AccordionItem
                icon={<HelpCircle className="h-4 w-4 text-secondary/60" />}
                title="Frequently Asked Questions"
              >
                <div className="space-y-3 pt-2">
                  <h4>What is Prompt Optimizer?</h4>
                  <p>
                    Prompt Optimizer is a professional-grade tool that transforms vague, unstructured prompts into precision-engineered instructions using our proprietary rule-based engine with 14 domain-specific optimization strategies.
                  </p>
                  <h4>Is my data safe?</h4>
                  <p>
                    Absolutely. All prompt optimization happens on-device — your prompts never leave your browser. If you opt in to account sync, data is stored in encrypted MongoDB with strict access controls.
                  </p>
                  <h4>Do I need an API key?</h4>
                  <p>
                    No. The core optimization engine is entirely rule-based and runs locally. No external API calls are made unless you explicitly enable AI-powered features with your own key.
                  </p>
                  <h4>Which LLMs does it work with?</h4>
                  <p>
                    The optimized prompts work with any large language model — ChatGPT, Gemini, Claude, LLaMA, Mistral, and more. Our engine is model-agnostic by design.
                  </p>
                  <h4>Is it free?</h4>
                  <p>
                    Yes. The core prompt optimization engine is completely free. Premium features like AI-powered rewriting and cloud sync may be available in future tiers.
                  </p>
                </div>
              </AccordionItem>

              <AccordionItem
                icon={<Shield className="h-4 w-4 text-chart-3/60" />}
                title="Privacy Policy"
              >
                <div className="space-y-3 pt-2">
                  <p>
                    Your privacy is fundamentally important to us. This policy outlines how Prompt Optimizer handles your information.
                  </p>
                  <h4>Data Collection</h4>
                  <p>
                    We collect minimal data. Prompt optimization is performed entirely client-side. We do not log, store, or transmit your prompts to any server unless you explicitly opt in to account-based features.
                  </p>
                  <h4>Account Data</h4>
                  <p>
                    If you create an account, we store your email, name, and optimization history in encrypted MongoDB storage. This data is used solely to provide you with history sync and personalization features.
                  </p>
                  <h4>Cookies &amp; Analytics</h4>
                  <p>
                    We use essential cookies for authentication. We do not use third-party tracking, advertising cookies, or analytics services that compromise your privacy.
                  </p>
                  <h4>Third-Party Services</h4>
                  <p>
                    If you choose to enable AI-powered optimization, your prompts may be sent to third-party AI providers (Google Gemini, Groq) using your own API key. We do not intermediate or store these requests.
                  </p>
                  <h4>Your Rights</h4>
                  <p>
                    You have the right to access, modify, and delete your personal data at any time. Contact us to exercise these rights.
                  </p>
                </div>
              </AccordionItem>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Gradient Divider ─── */}
      <div className="footer-divider" />

      {/* ─── Bottom Bar ─── */}
      <div className="px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-8">
          {/* Developer Social Links */}
          <ScrollReveal variant="fadeUp" delay={0.1}>
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs text-muted-foreground/50 uppercase tracking-widest font-medium">
                Meet the Developer
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://linkedin.com/in/atharvakhair"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon linkedin"
                  aria-label="Developer LinkedIn Profile"
                >
                  <LinkedInIcon className="h-4.5 w-4.5" />
                </a>
                <a
                  href="https://github.com/AtharvaKhair12"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon github"
                  aria-label="Developer GitHub Profile"
                >
                  <GitHubIcon className="h-4.5 w-4.5" />
                </a>
              </div>
              <p className="text-[0.6875rem] text-muted-foreground/40 flex items-center gap-1.5">
                <ExternalLink className="h-3 w-3" />
                Personal developer profiles — not product accounts
              </p>
            </div>
          </ScrollReveal>

          {/* ─── Gradient Divider ─── */}
          <div className="footer-divider w-full max-w-md" />

          {/* Copyright + Meta */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded border border-primary/30 bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground/50">
                © {new Date().getFullYear()} Prompt Optimizer
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
        </div>
      </div>
    </footer>
  );
}
