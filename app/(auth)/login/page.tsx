"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { CursorGlow } from "@/components/CursorGlow";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/optimizer");
        router.refresh();
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
          <h1 className="text-2xl font-bold tracking-tight uppercase">Welcome Back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
