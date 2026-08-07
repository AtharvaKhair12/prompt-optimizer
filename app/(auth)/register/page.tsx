"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { CursorGlow } from "@/components/CursorGlow";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        router.push("/login?registered=true");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <CursorGlow />
      
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-10">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="cyber-panel p-8 w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="h-10 w-10 rounded border border-primary bg-primary/10 flex items-center justify-center animate-pulse-neon shadow-[0_0_10px_var(--primary)] mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-1">Join the optimizer platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              type="text" 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
              className="bg-black/20 border-primary/20 focus:border-primary focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="bg-black/20 border-primary/20 focus:border-primary focus:ring-primary/20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="bg-black/20 border-primary/20 focus:border-primary focus:ring-primary/20"
            />
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2" 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
