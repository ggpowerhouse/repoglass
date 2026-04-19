"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Share2 } from "lucide-react";
import { ScoreRing } from "@/components/score-ring";
import { verdictLabel } from "@/lib/rubric";
import type { RepoRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getEvent } from "@/lib/events";

export function VerdictCard({ repo }: { repo: RepoRecord }) {
  const v = verdictLabel(repo.total_score);
  const [copied, setCopied] = useState(false);

  const shareText =
    `RepoGlass · ${repo.owner}/${repo.name} — ${repo.total_score}/100 (${v.label})\n` +
    `${repo.verdict}\n` +
    `Foundation ${repo.pillar_subtotals.foundation}/25 · Build ${repo.pillar_subtotals.build}/25 · ` +
    `Impact ${repo.pillar_subtotals.impact}/25 · Builder ${repo.pillar_subtotals.builder}/25\n` +
    `${repo.url}`;

  const copy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-strong rounded-[28px] p-7 md:p-10 relative overflow-hidden"
    >
      {/* Aurora refracting through the glass */}
      <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-[#6C5DD3]/25 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-[#00F5A0]/20 blur-[120px]" />

      <div className="relative flex flex-col md:flex-row gap-6 md:gap-10 items-start">
        <div className="shrink-0">
          <ScoreRing score={repo.total_score} size={148} stroke={10} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={cn(
                "micro-cap glass rounded-full px-3 py-1",
                v.tone
              )}
            >
              {v.label}
            </span>
            {(() => {
              const ev = getEvent(repo.event_id);
              return (
                <span className="micro-cap glass rounded-full px-3 py-1 inline-flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: ev.accent,
                      boxShadow: `0 0 8px ${ev.accent}`,
                    }}
                  />
                  {ev.label}
                </span>
              );
            })()}
            <span className="micro-cap">
              {repo.analysis_source === "openai" ? "AI-judged" : "Heuristic"}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-semibold tracking-[-0.03em] font-mono">
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#a5b4fc] transition-colors"
            >
              {repo.owner}
              <span className="text-white/30 mx-2">/</span>
              <span className="text-gradient-aurora">{repo.name}</span>
            </a>
          </h1>

          <p className="text-base md:text-lg text-white/70 mt-4 leading-relaxed max-w-2xl">
            {repo.ai_summary}
          </p>

          <div className="mt-5 p-5 rounded-[20px] border border-white/8 bg-white/[0.02] relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6C5DD3]/50 to-transparent" />
            <div className="micro-cap mb-2">Verdict</div>
            <p className="text-[16px] text-white/90 leading-relaxed italic">
              &ldquo;{repo.verdict}&rdquo;
            </p>
            <div className="micro-cap mt-3">— {v.tagline}</div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {Object.entries(repo.pillar_subtotals).map(([k, val]) => (
              <div
                key={k}
                className="glass rounded-full px-3.5 py-1.5 flex items-center gap-2"
              >
                <span className="micro-cap capitalize !text-white/55">{k}</span>
                <span className="font-mono tabular-nums font-semibold text-sm">
                  {val}
                  <span className="text-white/30">/25</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={copy}
              className="droplet px-4 py-2 text-sm flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-[#00F5A0]" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy verdict
                </>
              )}
            </button>
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="droplet px-4 py-2 text-sm flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Open on GitHub
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
