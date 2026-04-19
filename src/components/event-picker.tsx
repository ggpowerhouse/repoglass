"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Calendar } from "lucide-react";
import { SELECTABLE_EVENTS, type EventId, getEvent } from "@/lib/events";

/**
 * Small glass dropdown — chooses which event a new submission belongs to.
 * Uses a controlled prop API and closes on outside click / Escape.
 */
export function EventPicker({
  value,
  onChange,
  disabled,
}: {
  value: EventId;
  onChange: (v: EventId) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = getEvent(value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="droplet h-10 px-3 pr-2.5 flex items-center gap-2 text-[12px] font-mono text-white/80 hover:text-white disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: current.accent, boxShadow: `0 0 8px ${current.accent}` }}
        />
        <Calendar className="h-3.5 w-3.5 text-white/50" />
        <span className="micro-cap !text-white/90 !text-[10px] truncate max-w-[140px]">
          {current.label}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-white/50 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-[260px] glass rounded-2xl p-1.5 z-50"
          role="listbox"
        >
          <div className="micro-cap px-3 py-2 !text-white/45">
            Submit to event
          </div>
          {SELECTABLE_EVENTS.map((e) => {
            const selected = e.id === value;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  onChange(e.id);
                  setOpen(false);
                }}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  selected
                    ? "bg-white/[0.06]"
                    : "hover:bg-white/[0.04]"
                }`}
                role="option"
                aria-selected={selected}
              >
                <span
                  className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                  style={{
                    background: e.accent,
                    boxShadow: `0 0 10px ${e.accent}`,
                  }}
                />
                <span className="flex-1 min-w-0">
                  <span className="block font-mono text-[12px] text-white">
                    {e.label}
                  </span>
                  <span className="block text-[11px] text-white/45 leading-snug mt-0.5">
                    {e.description}
                  </span>
                </span>
                {selected && <Check className="h-4 w-4 text-[#00F5A0] mt-0.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
