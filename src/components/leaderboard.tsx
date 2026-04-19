"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  GitFork,
  ExternalLink,
  Trophy,
  Medal,
  Award,
  ArrowRight,
} from "lucide-react";
import type { RepoRecord } from "@/lib/types";
import { PILLARS, type PillarKey, verdictLabel } from "@/lib/rubric";
import { ScoreRing } from "@/components/score-ring";
import { cn, formatNumber, timeAgo } from "@/lib/utils";
import { getBrowserSupabase } from "@/lib/store";
import { getEvent, type EventId } from "@/lib/events";

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <Trophy className="h-5 w-5 text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.6)]" />
    );
  if (rank === 2) return <Medal className="h-5 w-5 text-zinc-300" />;
  if (rank === 3) return <Award className="h-5 w-5 text-orange-400" />;
  return (
    <span className="text-white/40 text-sm font-mono tabular-nums w-5 text-center">
      {rank.toString().padStart(2, "0")}
    </span>
  );
}

const PILLAR_ORDER: PillarKey[] = ["foundation", "build", "impact", "builder"];

export function Leaderboard({
  initial,
  highlight,
  scope,
  filter,
}: {
  initial: RepoRecord[];
  highlight?: string;
  scope: EventId | "all";
  /** Optional client-side text filter applied after every fetch. */
  filter?: string;
}) {
  const [repos, setRepos] = useState<RepoRecord[]>(initial);

  useEffect(() => {
    setRepos(initial);
  }, [initial, scope]);

  useEffect(() => {
    const url = `/api/leaderboard?event=${scope}`;
    const poll = async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setRepos(data.repos ?? []);
      } catch {
        /* swallow */
      }
    };
    const t = setInterval(poll, 4000);
    return () => clearInterval(t);
  }, [scope]);

  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;
    const channel = sb
      .channel("repositories-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "repositories" },
        async () => {
          const res = await fetch(`/api/leaderboard?event=${scope}`, {
            cache: "no-store",
          });
          const data = await res.json();
          setRepos(data.repos ?? []);
        }
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [scope]);

  const sorted = useMemo(() => {
    const q = (filter ?? "").trim().toLowerCase();
    const base = [...repos].sort((a, b) => b.total_score - a.total_score);
    if (!q) return base;
    return base.filter((r) => {
      const slug = `${r.owner}/${r.name}`.toLowerCase();
      return (
        slug.includes(q) ||
        r.owner.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        r.verdict.toLowerCase().includes(q) ||
        (r.language ?? "").toLowerCase().includes(q)
      );
    });
  }, [repos, filter]);

  if (repos.length === 0) {
    return (
      <div className="glass rounded-[28px] p-16 text-center max-w-2xl mx-auto">
        <div className="text-5xl mb-4 text-white/30 font-mono">◌</div>
        <div className="text-lg font-medium">No entries yet</div>
        <div className="text-sm text-white/50 mt-2">
          Be the first — submit a repo from the home page.
        </div>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="glass rounded-[28px] p-12 text-center max-w-2xl mx-auto">
        <div className="text-4xl mb-3 text-white/30 font-mono">∅</div>
        <div className="text-[15px] font-medium">No repos match your filter</div>
        <div className="text-sm text-white/50 mt-1.5">
          Try a different term, or clear the filter.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {sorted.map((r, i) => {
          const v = verdictLabel(r.total_score);
          const slug = `${r.owner}/${r.name}`;
          return (
            <motion.div
              key={r.url}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
              className={cn(
                "glass glass-hover rounded-[24px] p-5 relative overflow-hidden group",
                highlight === r.url &&
                  "ring-2 ring-[#6C5DD3]/50 shadow-[0_0_48px_rgba(108,93,211,0.3)]"
              )}
            >
              {i === 0 && (
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00F5A0]/70 to-transparent" />
              )}
              {/* Subtle rank-lens — only blooms at #1 and on hover */}
              {i === 0 && (
                <div
                  className="absolute -top-20 -right-20 h-64 w-64 rounded-full pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-700"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(0,245,160,0.22) 0%, transparent 65%)",
                    filter: "blur(40px)",
                  }}
                />
              )}

              <Link
                href={`/repo/${slug}`}
                className="absolute inset-0 z-10"
                aria-label={`Open ${slug} detail`}
              />

              <div className="relative flex items-start gap-4 pointer-events-none">
                <div className="flex items-center gap-3 shrink-0 pt-1">
                  <RankMedal rank={i + 1} />
                </div>

                <div className="shrink-0">
                  <ScoreRing score={r.total_score} size={84} stroke={6} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-medium text-white truncate group-hover:text-[#a5b4fc] transition-colors">
                      {r.owner}
                      <span className="text-white/30 mx-1">/</span>
                      {r.name}
                    </span>
                    <span
                      className={cn(
                        "micro-cap glass rounded-full px-2.5 py-0.5 !text-[9px]",
                        v.tone
                      )}
                    >
                      {v.label}
                    </span>
                    {(() => {
                      const ev = getEvent(r.event_id);
                      return (
                        <span
                          className="micro-cap glass rounded-full px-2.5 py-0.5 !text-[9px] inline-flex items-center gap-1.5"
                          title={`Event: ${ev.label}`}
                        >
                          <span
                            className="h-1 w-1 rounded-full"
                            style={{
                              background: ev.accent,
                              boxShadow: `0 0 6px ${ev.accent}`,
                            }}
                          />
                          {ev.label}
                        </span>
                      );
                    })()}
                    {r.language && (
                      <span className="micro-cap glass rounded-full px-2.5 py-0.5 !text-[9px]">
                        {r.language}
                      </span>
                    )}
                    <div className="flex items-center gap-3 text-xs text-white/45 ml-auto font-mono">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" /> {formatNumber(r.stars)}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="h-3 w-3" /> {formatNumber(r.forks)}
                      </span>
                      <span className="hidden md:inline text-white/35">
                        {timeAgo(r.created_at)}
                      </span>
                    </div>
                  </div>

                  <p className="text-[14px] text-white/75 mt-2 leading-relaxed line-clamp-2 italic">
                    &ldquo;{r.verdict}&rdquo;
                  </p>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {PILLAR_ORDER.map((pk) => {
                      const meta = PILLARS[pk];
                      const sub = r.pillar_subtotals[pk];
                      return (
                        <div
                          key={pk}
                          className="flex items-center gap-1.5 glass rounded-full pl-2 pr-3 py-1 text-[11px]"
                          title={`${meta.label} subtotal`}
                        >
                          <span>{meta.icon}</span>
                          <span className="text-white/50">{meta.label}</span>
                          <span className="font-mono tabular-nums font-medium">
                            {sub}
                          </span>
                          <span className="text-white/30">/25</span>
                        </div>
                      );
                    })}

                    {r.has_dockerfile && (
                      <span className="micro-cap glass rounded-full px-2.5 py-0.5 !text-[9px] text-[#7dd3fc]">
                        Docker
                      </span>
                    )}
                    {r.has_ci && (
                      <span className="micro-cap glass rounded-full px-2.5 py-0.5 !text-[9px] text-[#a5b4fc]">
                        CI
                      </span>
                    )}
                    {r.has_tests && (
                      <span className="micro-cap glass rounded-full px-2.5 py-0.5 !text-[9px] text-[#00F5A0]">
                        Tests
                      </span>
                    )}
                    {r.has_live_demo && (
                      <span className="micro-cap glass rounded-full px-2.5 py-0.5 !text-[9px] text-[#f0abfc]">
                        Live
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 self-center opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              <div className="relative flex items-center gap-3 mt-3 pointer-events-auto">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="micro-cap !text-white/40 hover:!text-white inline-flex items-center gap-1 z-20 relative"
                >
                  <ExternalLink className="h-3 w-3" />
                  GitHub
                </a>
                <Link
                  href={`/repo/${slug}`}
                  className="micro-cap !text-white/40 hover:!text-white inline-flex items-center gap-1 z-20 relative ml-auto"
                >
                  Full judgment
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
