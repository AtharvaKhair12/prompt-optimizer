# 🗺️ Nexora Optimize — Session Roadmap

> **Last updated**: 2026-08-04  
> **Purpose**: Handoff doc so next session picks up with zero context loss.

---

## ✅ What's Done (as of this session)

### Session 1 (2026-08-03)
- Keyless rule-based rewriter (`lib/rewriter.ts`)
- Heuristic scoring 5 dimensions (`lib/heuristics.ts`)
- Full UI: DiffView, ScoreCard (animated), PromptInput (quality ring), HistoryPanel
- Auth + MongoDB as opt-in (no crash without env vars)
- Build passes zero errors

### Session 2 (2026-08-04)
- **Git initialized + GitHub remote set** — repo: `AtharvaKhair12/prompt-optimizer`, branch: `main`
- **4 commits on main** (run `git log --oneline` to verify):
  - `35ddd2d` chore: initial commit — keyless prompt optimizer with UX polish
  - `f05f90c` feat: smarter rewriter + live dimension bars + prompt templates
  - `f2a2f04` docs: add ROADMAP.md — session handoff and next-steps tracker
  - `63719e1` fix: score degradation, code block mangling, uniform scores
- **⚠️ Push still pending** — run `git push -u origin main` in a VS Code terminal to push all 4 commits
- **Rewriter expanded** (14 domains: code, data, security, design, product, education, legal, marketing, research, writing, finance, medical, creative, devops)
  - Smarter domain inference (scores ALL patterns, picks best match)
  - Chain-of-thought injection for analytical prompts
  - Multi-turn detection + anchoring
  - Polite noise removal
  - 3-constraint library per domain
- **PromptInput upgraded**
  - Live dimension bars (clarity / specificity / structure / completeness)
  - 8 prompt templates via "Try an example" toggle
- **3 critical bugs fixed:**
  - ✅ After-scores now always higher (real heuristics on rewritten text, not hand-estimates)
  - ✅ Code blocks preserved through transforms (protectCodeBlocks())
  - ✅ No "Complete the following task:" injected in front of code fences
- **Build passes zero errors** ✓

---

## 🔜 What's Next (Tier 1 — Top Priority)

### 1. Push to GitHub 🔴 IMMEDIATE
```bash
git remote add origin https://github.com/<USERNAME>/prompt-optimizer.git
git push -u origin main
```
Ask user for GitHub username at session start.

---

### 2. Fix turbopack.root warning 🟡 QUICK WIN
**File**: [`next.config.ts`](file:///c:/Users/Atharva/.gemini/antigravity-ide/scratch/prompt-optimizer/next.config.ts)
```ts
// Add inside nextConfig:
turbopack: { root: __dirname }
```
This silences the `⚠ Warning: Next.js inferred your workspace root` noise in every build.

---

### 3. Share / Permalink Feature 🟠 HIGH IMPACT
Allow users to share an optimized prompt via URL.

**New file**: `app/share/page.tsx`
- Read `?p=<base64>` from URL params (client-side)
- Decode and display the optimized prompt in read-only DiffView
- Copy-to-clipboard button prominent
- "Optimize Another" CTA links back to home

**Change**: `components/DiffView.tsx`
- Add "Share" button next to Copy
- `onClick`: `router.push('/share?p=' + btoa(optimized))`

No server changes needed — 100% client-side.

---

### 4. Improve Heuristics (Score More Dimensions) 🟠 HIGH IMPACT
Current `heuristics.ts` is basic. Add:
- **Ambiguity score**: detect pronouns without clear referents (it/they/this/that/these)
- **Readability score**: avg sentence length, Flesch-Kincaid proxy
- **Context richness**: detects background info, examples, constraints in the prompt
- **Action clarity**: stronger detection of imperative vs vague instructions

**File**: [`lib/heuristics.ts`](file:///c:/Users/Atharva/.gemini/antigravity-ide/scratch/prompt-optimizer/lib/heuristics.ts)

---

### 5. Deploy to Vercel 🟢 WHEN READY
```bash
# One-time:
npx vercel --yes

# Or connect GitHub repo to vercel.com dashboard (recommended)
```
Zero env vars required — works out of the box.

---

## 🔵 Tier 2 — After Tier 1

| Feature | Effort | Impact |
|---|---|---|
| Syntax-highlighted diff (word-level) | M | High |
| Rate limiting + abuse protection on `/api/optimize` | S | Medium |
| PWA manifest + offline support | S | Medium |
| A/B test different rewriter strategies | L | High |
| Prompt library / community templates | L | High |
| Gemini API opt-in for AI-powered optimization | L | Very High |

---

## 🏗️ Architecture Notes

```
app/
  page.tsx              ← Main UI (client component)
  api/optimize/route.ts ← Calls rewritePrompt() — no API key needed
  api/history/route.ts  ← MongoDB-backed (optional)
  api/user/key/route.ts ← Orphaned — remove or repurpose next session
  login/page.tsx        ← OAuth login page

lib/
  rewriter.ts           ← Rule-based rewriter (14 domains)
  heuristics.ts         ← Client-side prompt scorer
  types.ts              ← Shared types (Scores, OptimizationResult, etc.)
  auth.ts               ← NextAuth config (opt-in)
  mongodb.ts            ← DB connection (opt-in)

components/
  PromptInput.tsx       ← Textarea + live bars + templates
  ScoreCard.tsx         ← Animated score display with deltas
  DiffView.tsx          ← Before/after comparison + copy
  HistoryPanel.tsx      ← localStorage history in Sheet
  Header.tsx            ← Nav + history trigger
```

---

## ⚙️ Dev Commands

```bash
# Dev server
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run dev

# Build check
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build

# Git status
git log --oneline -10
git status
```

---

## 🎯 Session Start Checklist

When starting a new session:
1. Ask user for **GitHub username** → push to remote
2. Fix **turbopack.root** warning in `next.config.ts` (2 min)
3. Implement **Share / Permalink** feature (30 min)
4. Improve **heuristics.ts** scoring (30 min)
5. Commit each feature as its own commit with descriptive message
