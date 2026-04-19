"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PARAMS_BY_PILLAR, PILLARS, type PillarKey } from "@/lib/rubric";
import type { Scores } from "@/lib/types";

function BarMeter({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const color =
    value >= 8 ? "#00F5A0" : value >= 6 ? "#8B7FEA" : value >= 4 ? "#fbbf24" : "#f87171";
  return (
    <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct * 100}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: color, boxShadow: `0 0 12px ${color}90` }}
        className="h-full rounded-full"
      />
    </div>
  );
}

export function PillarBlock({
  pillar,
  subtotal,
  scores,
}: {
  pillar: PillarKey;
  subtotal: number;
  scores: Scores;
}) {
  const meta = PILLARS[pillar];
  const params = PARAMS_BY_PILLAR[pillar];

  return (
    <div className="glass rounded-[24px] p-6 md:p-7 relative overflow-hidden">
      <div
        className={cn(
          "absolute -top-24 -right-24 h-64 w-64 rounded-full blur-[90px] opacity-50 bg-gradient-to-br to-transparent",
          meta.tone
        )}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{meta.icon}</span>
              <h3 className="text-[22px] font-semibold tracking-tight">
                {meta.label}
              </h3>
            </div>
            <p className="text-[13px] text-white/50 mt-1">{meta.subtitle}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-mono font-semibold tabular-nums">
              {subtotal}
              <span className="text-white/30 text-sm font-normal">/25</span>
            </div>
            <div className="micro-cap mt-1">Pillar subtotal</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {params.map((p) => {
            const s = scores[p.key];
            return (
              <div
                key={p.key}
                className="rounded-[18px] border border-white/6 bg-white/[0.02] p-4 hover:border-white/14 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <div className="text-[14px] font-medium">{p.label}</div>
                    <div className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
                      {p.description}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono tabular-nums text-[18px] font-semibold">
                      {s.score}
                      <span className="text-white/30 text-xs font-normal">
                        /10
                      </span>
                    </div>
                  </div>
                </div>
                <BarMeter value={s.score} />
                <p className="text-[13px] text-white/75 mt-3 leading-relaxed">
                  {s.reasoning}
                </p>
                {s.evidence.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {s.evidence.slice(0, 4).map((e, i) => (
                      <span
                        key={i}
                        className="text-[10px] rounded-md bg-white/5 border border-white/6 px-2 py-0.5 text-white/55 font-mono"
                        title={e}
                      >
                        {e.length > 52 ? e.slice(0, 52) + "…" : e}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
