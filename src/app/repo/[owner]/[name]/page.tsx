import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, GitFork, AlertTriangle, Sparkles, Target, Compass } from "lucide-react";
import { Nav } from "@/components/nav";
import { VerdictCard } from "@/components/verdict-card";
import { PillarBlock } from "@/components/pillar-block";
import { getRepoBySlug } from "@/lib/store";
import { formatNumber, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RepoDetailPage({
  params,
}: {
  params: Promise<{ owner: string; name: string }>;
}) {
  const { owner, name } = await params;
  const repo = await getRepoBySlug(owner, name);
  if (!repo) notFound();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="aurora-bg opacity-60" />
      <div className="absolute inset-0 grid-bg z-0" />
      <Nav />

      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-24">
        <Link
          href="/leaderboard"
          className="droplet inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-white/60 hover:text-white mb-6"
        >
          <ArrowLeft className="h-3 w-3" />
          <span className="micro-cap !text-white/60">Leaderboard</span>
        </Link>

        <VerdictCard repo={repo} />

        <div className="mt-6 glass rounded-[20px] p-5 flex flex-wrap gap-3 items-center text-sm text-white/70 font-mono">
          <span className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" />
            {formatNumber(repo.stars)} stars
          </span>
          <span className="flex items-center gap-1.5">
            <GitFork className="h-3.5 w-3.5" />
            {formatNumber(repo.forks)} forks
          </span>
          {repo.language && (
            <span className="micro-cap glass rounded-full px-2.5 py-0.5">
              {repo.language}
            </span>
          )}
          {repo.has_dockerfile && (
            <span className="micro-cap glass rounded-full px-2.5 py-0.5 !text-[#7dd3fc]">
              Docker
            </span>
          )}
          {repo.has_ci && (
            <span className="micro-cap glass rounded-full px-2.5 py-0.5 !text-[#a5b4fc]">
              CI
            </span>
          )}
          {repo.has_tests && (
            <span className="micro-cap glass rounded-full px-2.5 py-0.5 !text-[#00F5A0]">
              Tests
            </span>
          )}
          {repo.has_live_demo && (
            <span className="micro-cap glass rounded-full px-2.5 py-0.5 !text-[#f0abfc]">
              Live demo
            </span>
          )}
          <span className="ml-auto micro-cap">
            Judged {timeAgo(repo.created_at)}
          </span>
        </div>

        {/* 4 pillars with 16 parameters */}
        <div className="mt-8 space-y-5">
          <PillarBlock
            pillar="foundation"
            subtotal={repo.pillar_subtotals.foundation}
            scores={repo.scores}
          />
          <PillarBlock
            pillar="build"
            subtotal={repo.pillar_subtotals.build}
            scores={repo.scores}
          />
          <PillarBlock
            pillar="impact"
            subtotal={repo.pillar_subtotals.impact}
            scores={repo.scores}
          />
          <PillarBlock
            pillar="builder"
            subtotal={repo.pillar_subtotals.builder}
            scores={repo.scores}
          />
        </div>

        {/* Founder-mode insights */}
        <div className="mt-8 grid md:grid-cols-2 gap-5">
          <InsightCard
            icon={<Sparkles className="h-4 w-4 text-emerald-300" />}
            tone="emerald"
            title="Green Flags"
            items={repo.green_flags}
          />
          <InsightCard
            icon={<AlertTriangle className="h-4 w-4 text-rose-300" />}
            tone="rose"
            title="Red Flags"
            items={repo.red_flags}
          />
          <InsightCard
            icon={<Sparkles className="h-4 w-4 text-indigo-300" />}
            tone="indigo"
            title="Strengths"
            items={repo.strengths}
          />
          <InsightCard
            icon={<AlertTriangle className="h-4 w-4 text-amber-300" />}
            tone="amber"
            title="Weaknesses"
            items={repo.weaknesses}
          />
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-5">
          <NarrativeCard
            icon={<Target className="h-4 w-4 text-fuchsia-300" />}
            title="The Moat"
            body={repo.moat}
            label="defensibility"
          />
          <NarrativeCard
            icon={<Compass className="h-4 w-4 text-cyan-300" />}
            title="If I Were You, Next Week"
            body={repo.pivot_suggestion}
            label="pivot advice"
          />
        </div>

        <div className="mt-10 text-center text-[11px] text-white/30">
          Scoring rubric: 4 pillars · 16 parameters · 100 pts · judged with
          evidence.{" "}
          <Link href="/rubric" className="underline hover:text-white/60">
            How it works
          </Link>
        </div>
      </section>
    </main>
  );
}

function InsightCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  tone: string;
  title: string;
  items: string[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="glass rounded-[20px] p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <div className="text-sm font-medium">{title}</div>
        <div className="micro-cap ml-auto">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li
            key={i}
            className="text-sm text-white/75 leading-relaxed flex gap-2"
          >
            <span className="text-white/30 shrink-0">·</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NarrativeCard({
  icon,
  title,
  body,
  label,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  label: string;
}) {
  return (
    <div className="glass rounded-[20px] p-5 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <div className="text-sm font-medium">{title}</div>
        <div className="micro-cap ml-auto">{label}</div>
      </div>
      <p className="text-sm text-white/80 leading-relaxed">{body}</p>
    </div>
  );
}
