"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, ExternalLink, Shield, Trash2, Check, Eye, EyeOff } from "lucide-react";
import { useSession } from "next-auth/react";

const LOCALSTORAGE_KEY = "promptopt_gemini_key";

interface ApiKeyModalProps {
  onKeyChange?: (hasKey: boolean) => void;
}

export function ApiKeyModal({ onKeyChange }: ApiKeyModalProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [hasLocalKey, setHasLocalKey] = useState(false);
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Check for existing keys on mount
  useEffect(() => {
    const localKey = localStorage.getItem(LOCALSTORAGE_KEY);
    setHasLocalKey(!!localKey);

    if (session?.user) {
      fetch("/api/user/key")
        .then((r) => r.json())
        .then((data) => setHasSavedKey(data.hasKey || false))
        .catch(() => {});
    }
  }, [session]);

  const hasAnyKey = hasLocalKey || hasSavedKey;

  useEffect(() => {
    onKeyChange?.(hasAnyKey);
  }, [hasAnyKey, onKeyChange]);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);

    // Always save to localStorage
    localStorage.setItem(LOCALSTORAGE_KEY, apiKey.trim());
    setHasLocalKey(true);

    // If signed in, also save encrypted to server
    if (session?.user) {
      try {
        const res = await fetch("/api/user/key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: apiKey.trim() }),
        });
        if (res.ok) {
          setHasSavedKey(true);
        }
      } catch {
        // Non-fatal — at least it's in localStorage
      }
    }

    setSaving(false);
    setSaved(true);
    setApiKey("");
    onKeyChange?.(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 1200);
  };

  const handleRemove = async () => {
    localStorage.removeItem(LOCALSTORAGE_KEY);
    setHasLocalKey(false);

    if (session?.user) {
      try {
        await fetch("/api/user/key", { method: "DELETE" });
        setHasSavedKey(false);
      } catch {
        // Non-fatal
      }
    }

    onKeyChange?.(false);
  };

  const maskedKey = () => {
    const key = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!key) return "••••••••";
    return `••••${key.slice(-4)}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            id="api-key-button"
            variant={hasAnyKey ? "outline" : "default"}
            size="sm"
            className={`gap-2 transition-all ${
              hasAnyKey
                ? "border-primary/30 text-primary hover:bg-primary/10"
                : "animate-pulse-glow"
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            {hasAnyKey ? "API Key Set" : "Set API Key"}
          </Button>
        }
      />

      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Gemini API Key
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80">
            Your key is used to call the Gemini API. It&apos;s stored{" "}
            {session?.user ? "encrypted on our server and in" : "only in"} your browser
            — never logged or shared.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {hasAnyKey ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-mono">{maskedKey()}</span>
                </div>
                <div className="flex items-center gap-1">
                  {hasSavedKey && (
                    <span className="text-xs text-primary/70 mr-2">Synced</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive/70 hover:text-destructive"
                    onClick={handleRemove}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground/60">
                Want to update? Remove the current key first, then add a new one.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Input
                  id="api-key-input"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="pr-10 bg-muted/30 font-mono text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <Button
                onClick={handleSave}
                disabled={!apiKey.trim() || saving}
                className="w-full"
              >
                {saved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Saved!
                  </>
                ) : saving ? (
                  "Saving…"
                ) : (
                  "Save Key"
                )}
              </Button>
            </div>
          )}

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary/80 hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Get a free Gemini API key
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
