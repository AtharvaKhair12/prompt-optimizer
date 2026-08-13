# Nexora Optimize

> AI-powered prompt engineering — transform vague prompts into precise, well-structured instructions that get better results from any LLM.

## ✨ Features

- **Hybrid Analysis Pipeline**: Instant rule-based heuristics → in-browser semantic scoring → AI-powered rewrite
- **Bring Your Own Key (BYOK)**: Uses your free Gemini API key — zero server costs, zero shared quotas
- **Optional Auth**: Sign in with Google or GitHub to sync history and API key across devices
- **Privacy-First**: API keys encrypted with AES-256-GCM, never logged, never shared
- **Score Cards**: Visual before/after scoring across clarity, specificity, structure, and completeness
- **Diff View**: Word-level diff, side-by-side comparison, and copy-to-clipboard
- **History**: Persistent optimization history (localStorage for anonymous, MongoDB for signed-in)
- **Mobile-First**: Responsive down to 375px width

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15+ (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Client-side NLP | `@xenova/transformers` (MiniLM, WASM, in-browser) |
| LLM Engine | Google Gemini API (`gemini-2.5-flash-lite` / `gemini-2.5-flash`) |
| Auth | Auth.js v5 (Google + GitHub OAuth) |
| Database | MongoDB Atlas (M0 free cluster) |
| Validation | Zod |
| Testing | Vitest (unit) + Playwright (e2e) |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd nexora-optimize
npm install
```

### 2. Environment Variables

Copy the template and fill in your values:

```bash
cp .env.local.example .env.local
```

**Required for basic functionality (BYOK mode):**
- None! The app works out of the box — users enter their own API key.

**Required for auth & sync features:**

| Variable | Source | Free? |
|----------|--------|-------|
| `MONGODB_URI` | [MongoDB Atlas](https://cloud.mongodb.com) — create M0 cluster | ✅ Forever free |
| `AUTH_SECRET` | `openssl rand -base64 32` | N/A |
| `AUTH_GOOGLE_ID` | [Google Cloud Console](https://console.cloud.google.com) — OAuth client | ✅ Free |
| `AUTH_GOOGLE_SECRET` | Same as above | ✅ Free |
| `AUTH_GITHUB_ID` | [GitHub Developer Settings](https://github.com/settings/developers) — OAuth App | ✅ Free |
| `AUTH_GITHUB_SECRET` | Same as above | ✅ Free |
| `ENCRYPTION_KEY` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | N/A |

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Get a Gemini API Key

Visit [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) to get a free key.

## 🧪 Testing

```bash
# Unit tests
npx vitest run

# E2E tests (starts dev server automatically)
npx playwright test
```

## 📁 Project Structure

```
app/
  layout.tsx              # Root layout with providers
  page.tsx                # Main page (orchestrates optimization flow)
  login/page.tsx          # OAuth sign-in page
  api/
    optimize/route.ts     # POST — Gemini optimization endpoint
    auth/[...nextauth]/   # Auth.js route handler
    history/route.ts      # GET/DELETE — optimization history
    user/key/route.ts     # POST/DELETE/GET — encrypted API key management
components/
  PromptInput.tsx         # Textarea with char count, Ctrl+Enter shortcut
  ApiKeyModal.tsx         # API key dialog with save/remove/sync
  ScoreCard.tsx           # Animated score visualization
  DiffView.tsx            # Word-level diff, side-by-side, copy-to-clipboard
  HistoryPanel.tsx        # Slide-out history sheet
  AuthButton.tsx          # Sign in/out with avatar dropdown
  Header.tsx              # App header with glassmorphism
  Providers.tsx           # Client-side providers wrapper
lib/
  heuristics.ts           # Rule-based prompt scorer (client-side)
  embeddings.ts           # Semantic scorer via Xenova MiniLM (client-side, WASM)
  gemini.ts               # Gemini API wrapper with structured output + backoff
  types.ts                # Zod schemas + TypeScript types
  mongodb.ts              # Singleton MongoClient
  encryption.ts           # AES-256-GCM encrypt/decrypt
  auth.ts                 # Auth.js v5 config
  exemplars.json          # 12 curated well-formed prompt examples
tests/
  heuristics.test.ts      # Unit tests for heuristic scorer
  e2e.spec.ts             # Playwright end-to-end tests
```

## 🔐 Security

- API keys are **never logged**, **never returned to the client** after saving
- Stored keys are encrypted with **AES-256-GCM** using a server-side encryption key
- JWT sessions — no database read per request
- History and key operations are **session-protected**
- OAuth only — no email/password, no email service needed

## 🌐 Deployment

1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new) (Hobby tier, free)
3. Add all env vars from `.env.local.example`
4. Update OAuth callback URLs:
   - Google: `https://<your-domain>/api/auth/callback/google`
   - GitHub: `https://<your-domain>/api/auth/callback/github`
5. Deploy!

## 💰 Cost

**$0.** Every service in the stack is free-tier:
- MongoDB Atlas M0: 512MB, no credit card, no expiry
- Vercel Hobby: free
- Google OAuth: free
- GitHub OAuth: free
- Gemini API: free tier (BYOK — each user uses their own quota)
- Auth.js: open source
- Xenova/Transformers: runs client-side, no server cost

## License

MIT
