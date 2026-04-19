# RepoGlass · Supabase Query Toolkit

Copy-paste-ready SQL for inspecting, exporting, and moderating the live
`public.repositories` table. Every query is read-only except the section
clearly marked **Dangerous**.

**Where to run**: Supabase Dashboard → SQL Editor → New query.

---

## 1. Quickstart — is the app actually using Supabase?

Run this right after a submission on the live site. If it returns your row,
the write path is healthy.

```sql
select
  id,
  owner || '/' || name  as slug,
  event_id,
  total_score,
  analysis_source,
  verdict,
  created_at
from public.repositories
order by created_at desc
limit 10;
```

Interpretation:

- `analysis_source = 'llm'`  → Groq/OpenAI scoring is live
- `analysis_source = 'heuristic'`  → LLM credentials aren't reaching the runtime (check Vercel env vars)
- Zero rows despite submissions on the live URL → env vars for Supabase didn't stick and the app silently fell back to in-memory storage

---

## 2. Count & breakdown

### Total repos indexed
```sql
select count(*) as total from public.repositories;
```

### Split by event
```sql
select event_id, count(*) as n
from public.repositories
group by event_id
order by n desc;
```

### Split by AI source
```sql
select analysis_source, count(*) as n
from public.repositories
group by analysis_source;
```

### Scoring distribution (histogram, 10-point buckets)
```sql
select
  (total_score / 10) * 10 as bucket_min,
  ((total_score / 10) * 10) + 9 as bucket_max,
  count(*) as n
from public.repositories
group by bucket_min, bucket_max
order by bucket_min desc;
```

---

## 3. Leaderboards (matches what the UI shows)

### Global top 10
```sql
select
  rank() over (order by total_score desc, created_at asc) as rank,
  owner || '/' || name as slug,
  event_id,
  total_score,
  verdict,
  stars,
  created_at
from public.repositories
order by total_score desc, created_at asc
limit 10;
```

### BUILD-A-THON leaderboard
```sql
select
  rank() over (order by total_score desc, created_at asc) as rank,
  owner || '/' || name as slug,
  total_score,
  verdict,
  created_at
from public.repositories
where event_id = 'build-a-thon'
order by total_score desc, created_at asc;
```

### Recent activity (last 24 h)
```sql
select
  owner || '/' || name as slug,
  event_id,
  total_score,
  verdict,
  created_at
from public.repositories
where created_at > now() - interval '24 hours'
order by created_at desc;
```

---

## 4. Search

### By owner or repo name (case-insensitive partial match)
```sql
select
  owner || '/' || name as slug,
  event_id,
  total_score,
  verdict,
  url
from public.repositories
where
  owner ilike '%SEARCH_TERM%'
  or name  ilike '%SEARCH_TERM%'
order by total_score desc;
```

Replace `SEARCH_TERM` — keep the surrounding `%` for "contains" matching.

### By verdict text (find specific founder-mode phrases)
```sql
select
  owner || '/' || name as slug,
  total_score,
  verdict
from public.repositories
where verdict ilike '%pivot%'
order by created_at desc;
```

### By language
```sql
select
  owner || '/' || name as slug,
  language,
  total_score
from public.repositories
where language = 'TypeScript'
order by total_score desc;
```

### By exact URL (useful for support/debug)
```sql
select * from public.repositories
where url = 'https://github.com/OWNER/REPO';
```

---

## 5. Deep inspection of a single repo

Once you have an `id` from the queries above, pull the full record including
the nested 16-parameter scoring object:

```sql
select
  id,
  owner || '/' || name as slug,
  total_score,
  pillar_subtotals,
  scores,                    -- 16-parameter breakdown with evidence
  strengths,
  weaknesses,
  red_flags,
  green_flags,
  moat,
  pivot_suggestion
from public.repositories
where id = 'PASTE_UUID_HERE';
```

### Extract a single parameter's reasoning (example: problemDepth)
```sql
select
  owner || '/' || name as slug,
  (scores -> 'problemDepth' ->> 'score')::int as problem_depth,
  scores -> 'problemDepth' ->> 'reasoning'    as reasoning
from public.repositories
order by problem_depth desc;
```

The same pattern works for any of these parameter keys:

`problemDepth`, `userEmpathy`, `originality`, `evidenceOfResearch`,
`functionalMvp`, `toolMastery`, `uxIntuition`, `executability`,
`valueProp`, `scalability`, `sustainability`, `safety`,
`resourcefulness`, `pivotAgility`, `technicalCuriosity`, `collaboration`.

---

## 6. Realtime health check

This confirms your table is published to the `supabase_realtime` channel —
which is what makes the live leaderboard update without reload.

```sql
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename = 'repositories';
```

If this returns **zero rows**, Realtime is OFF. Fix via Dashboard:
Database → Replication → toggle `repositories` ON under `supabase_realtime`.
Or rerun `supabase/schema.sql` (the bottom block is idempotent).

---

## 7. Export to CSV

Supabase SQL editor's **Download CSV** button (bottom-right of the results
pane) works on any `select`. Useful exports:

### Submissions spreadsheet for a hackathon recap
```sql
select
  owner || '/' || name  as slug,
  url,
  event_id,
  total_score,
  pillar_subtotals ->> 'foundation' as foundation_25,
  pillar_subtotals ->> 'build'      as build_25,
  pillar_subtotals ->> 'impact'     as impact_25,
  pillar_subtotals ->> 'builder'    as builder_25,
  analysis_source,
  verdict,
  created_at
from public.repositories
order by total_score desc;
```

Run → **Download CSV**.

---

## 8. Moderation & cleanup — ⚠️ Dangerous (writes to production)

These modify data. The web admin panel at `/admin` does the same things with
a confirmation UI, so prefer it unless you're doing something bulk.

### Change a single repo's event scope
```sql
update public.repositories
set event_id = 'global'
where id = 'UUID_HERE';
```

### Bulk-move anything that's not BUILD-A-THON into Global
```sql
update public.repositories
set event_id = 'global'
where event_id not in ('build-a-thon', 'global');
```

### Remove a specific submission (e.g. accidental / spam / NSFW)
```sql
delete from public.repositories
where id = 'UUID_HERE';
```

### Wipe all test submissions before going live with real users
```sql
-- Review before running. This is irreversible.
truncate public.repositories restart identity;
```

### Keep the top 100 only (in case of spam flood)
```sql
delete from public.repositories
where id not in (
  select id from public.repositories
  order by total_score desc, created_at asc
  limit 100
);
```

---

## 9. Diagnostics / debugging

### Rows with suspicious/missing data
```sql
select id, owner, name, total_score, analysis_source
from public.repositories
where total_score is null
   or total_score < 0
   or total_score > 100
   or scores is null
   or pillar_subtotals is null;
```

### Duplicate URL check (the unique constraint should prevent this,
### but surfaces any replication weirdness)
```sql
select url, count(*) as n
from public.repositories
group by url
having count(*) > 1;
```

### Table size + indexes (performance sanity)
```sql
select
  pg_size_pretty(pg_total_relation_size('public.repositories')) as total,
  pg_size_pretty(pg_relation_size('public.repositories'))       as rows_only,
  pg_size_pretty(pg_indexes_size('public.repositories'))        as indexes;
```

---

## 10. Security sanity

### Confirm RLS is on
```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'repositories';
```

`rowsecurity` must be `true`. If it's false, rerun `supabase/schema.sql`.

### List active policies on the table
```sql
select polname, polcmd, polroles::text, polqual::text
from pg_policy
where polrelid = 'public.repositories'::regclass;
```

You should see exactly one: `"public read"` on `SELECT` with condition `true`.
Inserts/updates/deletes use the service-role key from your Next.js API routes
and bypass RLS by design — they should NOT appear here.

---

## Appendix — shape of the `repositories` row

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `url` | `text` | unique, e.g. `https://github.com/owner/repo` |
| `event_id` | `text` | `build-a-thon` \| `global` |
| `owner` / `name` | `text` | GitHub owner + repo |
| `author` | `text` | repo owner's display name |
| `total_score` | `int` | 0–100 |
| `pillar_subtotals` | `jsonb` | `{foundation, build, impact, builder}` each 0–25 |
| `scores` | `jsonb` | keyed by 16 param keys → `{score, reasoning, evidence[]}` |
| `verdict` / `ai_summary` | `text` | the founder-mode narrative |
| `strengths` / `weaknesses` / `red_flags` / `green_flags` | `text[]` | up to 5 each |
| `moat` / `pivot_suggestion` | `text` | long-form take |
| `has_dockerfile` / `has_ci` / `has_tests` / `has_live_demo` | `boolean` | signals |
| `analysis_source` | `text` | `llm` \| `heuristic` |
| `created_at` | `timestamptz` | server time of insert |
