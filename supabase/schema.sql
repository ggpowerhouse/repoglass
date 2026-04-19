-- RepoGlass · Supabase schema
-- Run in: Supabase SQL editor

create extension if not exists "pgcrypto";

create table if not exists public.repositories (
  id uuid primary key default gen_random_uuid(),
  url text unique not null,
  event_id text not null default 'build-a-thon',
  owner text not null,
  name text not null,
  author text not null,
  avatar_url text,
  description text,
  stars int not null default 0,
  forks int not null default 0,
  language text,
  languages jsonb not null default '{}'::jsonb,
  topics text[] not null default '{}',

  -- 16-parameter scores, keyed by ParamKey -> { score, reasoning, evidence[] }
  scores jsonb not null,
  -- Per-pillar subtotals (0-25)
  pillar_subtotals jsonb not null,
  total_score int not null,

  ai_summary text not null,
  verdict text not null,
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  moat text not null,
  pivot_suggestion text not null,
  red_flags text[] not null default '{}',
  green_flags text[] not null default '{}',

  has_dockerfile boolean not null default false,
  has_ci boolean not null default false,
  has_tests boolean not null default false,
  has_live_demo boolean not null default false,
  readme_length int not null default 0,
  contributors_signal int not null default 0,
  pivot_signal boolean not null default false,

  analysis_source text not null default 'heuristic',
  created_at timestamptz not null default now()
);

create index if not exists idx_repositories_total_score
  on public.repositories (total_score desc);
create index if not exists idx_repositories_created_at
  on public.repositories (created_at desc);
create index if not exists idx_repositories_event_id
  on public.repositories (event_id);

-- Migration for existing deployments: back-fill legacy rows into "global".
alter table public.repositories
  add column if not exists event_id text not null default 'build-a-thon';
update public.repositories set event_id = 'global' where event_id is null;

alter table public.repositories enable row level security;

drop policy if exists "public read" on public.repositories;
create policy "public read"
  on public.repositories for select
  using (true);

-- Inserts/updates happen via the Next.js API route using the service-role key.

-- Enable Realtime on this table. Idempotent: safe to re-run.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'repositories'
  ) then
    execute 'alter publication supabase_realtime add table public.repositories';
  end if;
end $$;
