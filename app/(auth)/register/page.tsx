"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { ParticleField } from "@/components/ParticleField";
import { TiltCard } from "@/components/TiltCard";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login?registered=true");
        }, 1500);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Particle background */}
      <div className="fixed inset-0 z-0">
        <ParticleField particleCount={50} connectionDistance={90} />
      </div>

      {/* Ambient glows */}
      <div className="fixed top-1/3 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/3 left-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
      
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-10 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <TiltCard tiltDegree={5} className="rounded-xl">
          <div className="cyber-panel-premium p-8">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center py-8 gap-4"
              >
                <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-emerald-400">Account Created!</h2>
                <p className="text-sm text-muted-foreground/60">Redirecting to sign in...</p>
              </motion.div>
            ) : (
              <>
                <div className="flex flex-col items-center mb-8">
                  <div className="h-12 w-12 rounded-xl border border-primary/40 bg-primary/10 flex items-center justify-center animate-pulse-neon shadow-[0_0_20px_var(--primary)] mb-5">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-2xl font-black tracking-tight uppercase gradient-text">Create Account</h1>
                  <p className="text-muted-foreground/60 text-sm mt-2">Join the optimizer platform</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground/60">Full Name</Label>
                    <Input 
                      id="name" 
                      type="text" 
                      placeholder="John Doe" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required 
                      className="bg-black/30 border-primary/15 focus:border-primary/40 focus:ring-0 focus:shadow-[0_0_15px_oklch(0.65_0.22_290_/_0.15)] transition-all h-11"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground/60">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="you@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                      className="bg-black/30 border-primary/15 focus:border-primary/40 focus:ring-0 focus:shadow-[0_0_15px_oklch(0.65_0.22_290_/_0.15)] transition-all h-11"
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground/60">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      className="bg-black/30 border-primary/15 focus:border-primary/40 focus:ring-0 focus:shadow-[0_0_15px_oklch(0.65_0.22_290_/_0.15)] transition-all h-11"
                    />
                  </motion.div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm text-destructive text-center animate-shake"
                    >
                      {error}
                    </motion.p>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full btn-3d bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 text-base shadow-[0_0_20px_var(--primary)_inset]" 
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {isLoading ? "Creating account..." : "Sign Up"}
                    </Button>
                  </motion.div>
                </form>

                <div className="mt-8 text-center text-sm text-muted-foreground/50">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </TiltCard>
      </motion.div>
    </div>
  );
}
