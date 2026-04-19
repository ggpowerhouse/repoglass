"use client";

import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { EVENTS, type EventId } from "@/lib/events";

type Scope = EventId | "all";

/**
 * Segmented glass pill — Apple-inspired spring-in indicator.
 * "All" aggregates every bucket; the other chips scope to a single event.
 */
export function EventTabs({
  value,
  onChange,
  counts,
}: {
  value: Scope;
  onChange: (v: Scope) => void;
  counts: Record<string, number>;
}) {
  const items: Array<
    | { id: "all"; label: string; accent: string }
    | { id: EventId; label: string; accent: string }
  > = [
    { id: "all", label: "All", accent: "#FFFFFF" },
    ...EVENTS.map((e) => ({ id: e.id, label: e.label, accent: e.accent })),
  ];

  return (
    <div
      role="tablist"
      className="glass rounded-full p-1 flex items-center gap-0.5 overflow-x-auto max-w-full"
    >
      {items.map((it) => {
        const active = value === it.id;
        const n = it.id === "all" ? counts.all ?? 0 : counts[it.id] ?? 0;
        return (
          <button
            key={it.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(it.id)}
            className="relative px-3.5 py-1.5 rounded-full text-[12px] font-mono flex items-center gap-2 shrink-0 whitespace-nowrap transition-colors"
          >
            {active && (
              <motion.span
                layoutId="eventTab"
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.18), 0 0 22px rgba(108,93,211,0.28)",
                }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            {it.id === "all" ? (
              <Layers
                className={`relative h-3 w-3 ${
                  active ? "text-white" : "text-white/45"
                }`}
              />
            ) : (
              <span
                className="relative h-1.5 w-1.5 rounded-full shrink-0"
                style={{
                  background: it.accent,
                  boxShadow: active ? `0 0 8px ${it.accent}` : "none",
                }}
              />
            )}
            <span
              className={`relative ${
                active ? "text-white" : "text-white/55 hover:text-white/85"
              }`}
            >
              {it.label}
            </span>
            <span
              className={`relative text-[10px] tabular-nums ${
                active ? "text-white/70" : "text-white/35"
              }`}
            >
              {n.toString().padStart(2, "0")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
