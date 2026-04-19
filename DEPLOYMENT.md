# Deploying RepoGlass to the public internet

**Recommended stack:** Vercel (host) + Supabase (database + realtime) + GitHub (source) + Cloudflare (DNS, optional) + OpenAI (judging) + a GitHub Personal Access Token (API quota).

This combination is the *most efficient* option for a Next.js 15 App Router app with realtime features:

- **Vercel** is built by the team that makes Next.js. Zero-config deploys, edge middleware support, serverless functions for the API routes, automatic HTTPS, free hobby tier that's enough for a hackathon.
- **Supabase** gives you Postgres + auth + realtime websockets out of the box. The free tier covers ~500 MB DB and 200 concurrent realtime clients — plenty for launch.
- **Cloudflare** (optional) gives you a production-grade DNS and free WAF/DDoS in front of Vercel, and lets you park your own domain.

> Total monthly cost to go live: **$0** on free tiers, ~$20/mo if you pay for OpenAI usage and a custom domain.

---

## Prerequisites (one-time)

1. A **GitHub account** with the code pushed to a repo (any name, public or private).
2. A **Vercel account** ([vercel.com/signup](https://vercel.com/signup)) — sign in with GitHub.
3. A **Supabase account** ([supabase.com](https://supabase.com)) — sign in with GitHub.
4. An **OpenAI account** with billing enabled and an API key ([platform.openai.com/api-keys](https://platform.openai.com/api-keys)).
5. A **GitHub Personal Access Token** with `public_repo` scope ([github.com/settings/tokens](https://github.com/settings/tokens)). This lifts the API rate limit from 60 req/hr (anonymous) to 5,000 req/hr (authed).

---

## Step 1 — Push the code to GitHub

From the project root:

```bash
cd /path/to/repoglass
git init -b main
git add .
git commit -m "Initial RepoGlass commit"
gh repo create repoglass --public --source=. --push   # or use github.com UI
```

If you'd rather keep it private, swap `--public` for `--private`. Either works with Vercel.

---

## Step 2 — Provision Supabase

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard), click **New Project**.
2. Name: `repoglass`. Pick a region close to your users (e.g. `ap-south-1` for India, `us-east-1` for US East).
3. Choose a strong **Database password** and save it in a password manager.
4. Wait ~2 min for the project to provision.
5. Open **SQL Editor → New Query**. Paste the entire contents of `supabase/schema.sql` and click **Run**. This creates the `repositories` table, indexes, RLS policies, and adds the table to the realtime publication.
6. Open **Settings → API** and copy:
   - **Project URL** → will be `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → will be `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → will be `SUPABASE_SERVICE_ROLE_KEY` (⚠️ never expose client-side)

---

## Step 3 — Deploy to Vercel

### Option A: via the web UI (recommended for first deploy)

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import** the GitHub repo you just pushed.
3. Framework preset: **Next.js** (auto-detected).
4. **Root Directory**: leave as project root.
5. **Build Command / Output**: leave defaults.
6. Expand **Environment Variables** and add (one-by-one, scope = `Production, Preview, Development`):

   | Key | Value | Notes |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL | from Step 2 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key | from Step 2 |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service role key | from Step 2 |
   | `OPENAI_API_KEY` | `sk-…` | your OpenAI key |
   | `GITHUB_TOKEN` | `ghp_…` | your PAT for GitHub |
   | `ADMIN_EMAIL` | `admin@gmail.com` | or change to your email |
   | `ADMIN_PASSWORD` | strong random string | **change the default before going live** |
   | `ADMIN_SESSION_SECRET` | run `openssl rand -hex 32` locally | used to sign admin cookies |

7. Click **Deploy**. First build takes ~90 seconds. You'll get a `https://<project>.vercel.app` URL.

### Option B: via the Vercel CLI

```bash
npm i -g vercel
vercel login
cd /path/to/repoglass
vercel                 # one-time link: pick scope, "Link to existing project? No"
vercel env add OPENAI_API_KEY production    # repeat for each var above
vercel --prod
```

---

## Step 4 — Verify the live site

After the deploy finishes:

1. Open `https://<your-project>.vercel.app` — the hero should render with aurora and grid.
2. Submit a small public repo (e.g. `https://github.com/shadcn-ui/ui`). Within ~15 seconds you should see a score page.
3. Open `/leaderboard` — your entry should be there. Open it in a second tab and submit another repo; the first tab should update live thanks to Supabase realtime.
4. Open `/admin/login` and sign in with the credentials you set in env vars. The admin console should list every repo.
5. (Optional) confirm the Supabase table: **Table Editor → repositories** should show each row with populated `scores` and `pillar_subtotals` JSONB.

---

## Step 5 — Connect a custom domain

### On Vercel

1. Project → **Settings → Domains** → **Add** → enter `yourdomain.com` (or `repoglass.yourdomain.com`).
2. Vercel will show the DNS records you need.

### On your DNS provider (Cloudflare, Namecheap, GoDaddy, Route 53…)

- For an **apex domain** (`repoglass.com`): add an `A` record pointing to `76.76.21.21`.
- For a **subdomain** (`repoglass.yourdomain.com`): add a `CNAME` pointing to `cname.vercel-dns.com`.

Propagation takes 5 min – 1 hr. Vercel provisions a Let's Encrypt cert automatically.

> If you use Cloudflare, set the DNS record to **DNS only** (grey cloud) during initial verification, then flip to **Proxied** (orange cloud) once the cert is issued.

---

## Step 6 — Set up CI / branch previews (already automatic)

Vercel's GitHub integration gives you:

- **Preview deploys** on every PR — a unique URL shared in the PR checks.
- **Production deploys** on every push to `main`.
- **Instant rollback** from Vercel's deployments tab.

No extra config needed. Commit → push → done.

---

## Step 7 — Post-launch hardening

| Area | Action |
| --- | --- |
| Admin credentials | Rotate `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` the moment you go live. The defaults are **not** production-safe. |
| Supabase RLS | The schema ships with "public read, service-role write". Good. Never expose the service role key to the browser. |
| OpenAI spend | Set a monthly spend cap in the OpenAI dashboard → Billing → Limits. |
| Rate limiting | Add `@upstash/ratelimit` in front of `/api/analyze` if you get traffic. 10 req / 5 min / IP is a sensible start. |
| Observability | Vercel → Observability → enable **Logs** and **Speed Insights**. Free tier includes 90 days of logs. |
| Error tracking | Add Sentry (5 minutes). `npm i @sentry/nextjs && npx @sentry/wizard -i nextjs`. |
| Backups | Supabase → Database → Backups. Free tier has daily backups with 7-day retention. |
| Uptime | UptimeRobot (free) or BetterStack; monitor `/` and `/api/leaderboard`. |

---

## Alternative hosts (if you don't want Vercel)

| Platform | Best for | Caveats |
| --- | --- | --- |
| **Netlify** | Very similar to Vercel, slightly less Next.js 15 polish | Edge middleware works; cold starts a bit slower |
| **Cloudflare Pages + Workers** | Fastest global edge; free unlimited bandwidth | Requires `@opennextjs/cloudflare` adapter; some Node APIs unsupported — the admin crypto stays in Edge-safe `admin-edge.ts`, which is why we separated it |
| **Fly.io / Railway / Render** | Long-running Node server (no serverless cold starts) | You manage scaling; good if you plan to add websockets beyond Supabase |
| **AWS Amplify** | You already have AWS billing set up | Build config is more complex |
| **Self-hosted (Docker on a VM)** | Full control | You own uptime, SSL, scaling |

For this app, Vercel wins on time-to-production. If you expect viral load (>10k req/min), switch to **Fly.io** or **Cloudflare Pages** later.

---

## Alternative databases

Supabase is the easiest path because of built-in realtime and auth. If you'd rather not use it:

- **Neon** — serverless Postgres, free tier, great for Vercel. No built-in realtime; use polling (already built into the leaderboard component).
- **PlanetScale** — serverless MySQL. Requires rewriting the schema; no realtime.
- **Upstash Redis** — if you just want a fast KV store for the in-memory replacement. Good for the leaderboard cache layer.

The code auto-falls back to an in-memory store when Supabase env vars are absent, so you can start without a DB and add one later.

---

## Troubleshooting

**Q: Deploy fails with `crypto module not supported in Edge Runtime`.**
A: Fixed — admin middleware uses `src/lib/admin-edge.ts` (Web Crypto only). If you add new edge code, keep Node APIs out of it.

**Q: `/api/analyze` returns `GitHub rate limit hit`.**
A: Add `GITHUB_TOKEN` env var in Vercel and redeploy. Anonymous GitHub is limited to 60 req/hr.

**Q: Leaderboard doesn't update live.**
A: Check that (1) `supabase_realtime` publication includes `repositories` (it does after running `schema.sql`), (2) the anon key env var is set on the client (it's the `NEXT_PUBLIC_` one), (3) your browser isn't blocking websockets.

**Q: Admin login returns 401 even with correct creds.**
A: Verify `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` are set in the **Production** environment on Vercel, then redeploy. Env changes require a redeploy to take effect.

**Q: `@supabase/supabase-js` 429 errors.**
A: You hit the free-tier rate limit. Upgrade to **Supabase Pro** ($25/mo) or add a Vercel KV/Upstash cache for `/api/leaderboard`.

---

## Going further

1. **Add authentication for submissions** — Supabase Auth with GitHub OAuth, so each user's repos are tied to their GH profile.
2. **Webhook re-judging** — GitHub webhook → `/api/rejudge/:slug` re-runs the AI analysis on every push.
3. **Richer leaderboard** — add "trending this week", "by language", "by stars".
4. **OG image generation** — use `@vercel/og` to auto-generate shareable cards for each verdict.
5. **Per-event admins** — extend the `admin` model so event organizers can only see/manage their own event's repos.

---

Happy shipping.
