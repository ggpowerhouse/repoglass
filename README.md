# RepoGlass

**Drop a GitHub repo. Get judged like a founder.**

RepoGlass is an AI-powered judge for hackathon projects. It reads your repo — code, README, CI, commits, demo — and scores it across **4 pillars × 4 parameters = 16 evidence-cited dimensions**, total out of 100. Every score comes with reasoning and receipts. No vibes. No hand-waving.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8) ![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e) ![OpenAI](https://img.shields.io/badge/OpenAI-judged-412991)

---

## The rubric

Four pillars, 25 points each. Inside each pillar, 4 parameters scored 0-10. Judge grades every parameter with reasoning that cites concrete evidence from the repo.

### 🏗️ Foundation — the "Why"
Problem Depth · User Empathy · Originality · Evidence of Research

### 🛠️ Build — the "How"
Functional MVP · Tool Mastery · UX/UI Intuition · Executability

### 🚀 Impact — the "So What"
Value Proposition · Scalability · Sustainability · Ethics & Safety

### 👤 Builder — the "Who"
Resourcefulness · Pivot Agility · Technical Curiosity · Collaboration

Full anchor descriptions live at `/rubric` in the app.

---

## The output you get per repo

Every submission produces a detail page with:

- **Verdict card** — total score (out of 100), verdict label (Venture-Grade → Needs Rework), a founder-mode 1-line take, and the per-pillar subtotals.
- **16 parameter blocks** — score 0-10, 1-3 sentences of reasoning, up to 5 evidence bullets citing specific files/commits/signals.
- **Green flags / Red flags** — concrete positive and risk signals.
- **Strengths / Weaknesses** — what to keep, what to fix.
- **The Moat** — honest take on defensibility. Will say "no moat" if that's true.
- **If I Were You, Next Week** — a specific, actionable pivot suggestion.
- **Copy-verdict button** — one-click shareable summary for Twitter/LinkedIn/Slack.

---

## Quickstart

```bash
cd Build-A-Thon/repoglass
npm install
cp .env.example .env.local   # all keys optional for demo mode
npm run dev
```

Open http://localhost:3000

### Env vars (all optional)

| Key | Purpose | Fallback |
|---|---|---|
| `OPENAI_API_KEY` | Real LLM judging in Nikhil-Kamath voice | Deterministic heuristic scorer across all 16 params |
| `OPENAI_MODEL` | Override model (default `gpt-4o-mini`) | — |
| `GITHUB_TOKEN` | Lifts GitHub rate limit 60 → 5,000/hr | Anonymous (60/hr) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Persisted leaderboard + realtime | In-memory per-server board with 4s polling |

**Zero-config demo is the default.** Clone → `npm run dev` → it works. Heuristic scorer + in-memory board. No keys.

---

## Architecture

```
┌──────────────────┐   POST /api/analyze    ┌────────────────────┐
│ Landing / Submit │ ───────────────────►   │ fetchRepoContext   │
│  form            │                         │ (Octokit: repo,    │
└──────────────────┘                         │  README, tree,     │
                                             │  languages,        │
                                             │  commits,          │
                                             │  contributors,     │
                                             │  issues)           │
                                             └──────────┬─────────┘
                                                        ▼
                                             ┌────────────────────┐
                                             │ analyzeRepo        │
                                             │ · OpenAI + strict  │
                                             │   Zod schema       │
                                             │ · Server computes  │
                                             │   pillar subtotals │
                                             │   & total          │
                                             │ · Heuristic        │
                                             │   fallback         │
                                             └──────────┬─────────┘
                                                        ▼
┌──────────────────┐   GET /api/leaderboard  ┌────────────────────┐
│ Leaderboard      │ ◄──────────────────────│ Supabase OR memory │
│ (realtime +      │                         └────────────────────┘
│  polling)        │                                    │
└──────────────────┘                                    │
                                                        ▼
                                             ┌────────────────────┐
                                             │ /repo/[owner]/[name]│
                                             │  · VerdictCard      │
                                             │  · 4× PillarBlock   │
                                             │  · Green/Red flags  │
                                             │  · Moat + Pivot     │
                                             └────────────────────┘
```

### Folder layout

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts      # Ingest + judge + persist
│   │   └── leaderboard/route.ts
│   ├── repo/[owner]/[name]/page.tsx  # The full judgment
│   ├── leaderboard/page.tsx
│   ├── rubric/page.tsx           # Public rubric + anchors
│   ├── page.tsx                  # Landing
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── nav.tsx
│   ├── submit-form.tsx
│   ├── leaderboard.tsx           # Realtime, layout-animated
│   ├── verdict-card.tsx          # Top-of-detail verdict hero
│   ├── pillar-block.tsx          # 4 params w/ reasoning + evidence
│   ├── score-ring.tsx
│   └── ui/                       # shadcn-style primitives
└── lib/
    ├── rubric.ts                 # 16-param schema, pillar math, verdict labels
    ├── ai.ts                     # OpenAI judge + heuristic fallback
    ├── github.ts                 # Octokit ingestion w/ commit + contributor signal
    ├── store.ts                  # Supabase + in-memory
    ├── types.ts
    └── utils.ts
supabase/schema.sql               # Postgres schema + RLS + realtime
```

---

## Why this wins

1. **Evidence-cited judging.** Every score references a concrete signal — a file path, a commit, a README phrase. No "trust me".
2. **Server-computed totals.** The LLM proposes 0-10 scores per parameter. The server does the math. Arithmetic hallucinations are structurally impossible.
3. **Founder voice, not teacher voice.** The judge is blunt. Grades on whether the thing should exist, not on effort. Generous where deserved, brutal where earned.
4. **Every layer has a fallback.** OpenAI → heuristic. Supabase → memory. GitHub rate-limited → clear error + fix. Never a white screen.
5. **Zero-config demo.** No keys required to show it off.
6. **UI that isn't a template.** Aurora background, grid mask, animated SVG score rings, layout-animated leaderboard, glass panels with inset highlights.

---

## Deploy

Built for Vercel:

```bash
vercel
```

Set env vars in the Vercel dashboard. Run `supabase/schema.sql` in the Supabase SQL editor once for persistence.

---

## Scripts

```bash
npm run dev     # Dev server
npm run build   # Production build
npm run start   # Serve production build
npm run lint    # ESLint
```

Built with Next.js 15, TypeScript, Tailwind, Framer Motion, Octokit, OpenAI, Supabase, Zod.
