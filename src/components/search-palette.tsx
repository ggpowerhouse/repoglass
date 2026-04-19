"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, CornerDownLeft, Command as CommandIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEvent, type EventId } from "@/lib/events";

type Hit = {
  id: string;
  slug: string;
  url: string;
  owner: string;
  name: string;
  author: string;
  description: string | null;
  total_score: number;
  event_id: EventId;
  verdict: string;
  language: string | null;
};

function verdictTone(score: number) {
  if (score >= 80) return "text-[#00F5A0]";
  if (score >= 60) return "text-[#a5b4fc]";
  if (score >= 40) return "text-amber-300";
  return "text-white/60";
}

export function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Global keyboard: ⌘K / Ctrl+K to open, Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key === "k" || e.key === "K";
      if (isK && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      } else if (e.key === "/" && !open) {
        // "/" opens search when nothing else is focused on an input
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea" && !target?.isContentEditable) {
          e.preventDefault();
          setOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Also allow any component to dispatch a 'repoglass:open-search' CustomEvent.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("repoglass:open-search", onOpen);
    return () => window.removeEventListener("repoglass:open-search", onOpen);
  }, []);

  // Focus input whenever the palette opens.
  useEffect(() => {
    if (open) {
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Debounced fetch on query change (also fetch once on open with empty q
  // so the palette shows "top repos" when you first open it).
  useEffect(() => {
    if (!open) return;
    const ctl = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ctl;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const url = `/api/search?q=${encodeURIComponent(query)}&limit=10`;
        const res = await fetch(url, { cache: "no-store", signal: ctl.signal });
        if (!res.ok) return;
        const data = await res.json();
        setHits(data.hits ?? []);
        setTotal(data.total ?? 0);
        setActive(0);
      } catch {
        /* abort — ignore */
      } finally {
        setLoading(false);
      }
    }, 140);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [query, open]);

  const go = useCallback(
    (hit: Hit) => {
      setOpen(false);
      setQuery("");
      router.push(`/repo/${hit.slug}`);
    },
    [router]
  );

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(0, hits.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      const hit = hits[active];
      if (hit) {
        e.preventDefault();
        go(hit);
      }
    }
  };

  const emptyState = useMemo(() => {
    if (loading) return null;
    if (query && hits.length === 0)
      return {
        title: "No matches",
        body: `Nothing analyzed yet for “${query}”. Paste its GitHub URL on the home page to queue a fresh judgment.`,
      };
    if (!query && hits.length === 0 && !loading)
      return {
        title: "Nothing here yet",
        body: "Be the first — paste a public GitHub repo URL on the home page.",
      };
    return null;
  }, [loading, query, hits.length]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100]"
          aria-modal="true"
          role="dialog"
          aria-label="Search analyzed repositories"
        >
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-xl"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative mx-auto mt-[10vh] w-[min(720px,92vw)] glass glass-strong rounded-[28px] p-2 shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <Search className="h-4 w-4 text-white/55 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search analyzed repos by name, owner, verdict…"
                className="flex-1 bg-transparent outline-none text-[15px] font-mono placeholder:text-white/35 text-white/90"
                autoComplete="off"
                spellCheck={false}
              />
              <span className="micro-cap !text-[9px] hidden sm:inline">
                {total} indexed
              </span>
              <kbd className="glass rounded-md px-2 py-0.5 text-[10px] text-white/60 font-mono">
                Esc
              </kbd>
            </div>

            <div className="h-px bg-white/10" />

            <div
              ref={listRef}
              className="max-h-[60vh] overflow-y-auto py-2 px-1"
            >
              {loading && hits.length === 0 && (
                <div className="flex items-center gap-2 px-4 py-4 text-[13px] text-white/50">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Searching…
                </div>
              )}

              {emptyState && (
                <div className="px-4 py-8 text-center">
                  <div className="text-[15px] font-medium text-white/80">
                    {emptyState.title}
                  </div>
                  <div className="text-[13px] text-white/50 mt-1.5 max-w-md mx-auto">
                    {emptyState.body}
                  </div>
                </div>
              )}

              {hits.map((h, i) => {
                const ev = getEvent(h.event_id);
                const isActive = i === active;
                return (
                  <button
                    key={h.id}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(h)}
                    className={cn(
                      "w-full text-left flex items-start gap-3 px-3 py-3 rounded-[18px] transition-colors",
                      isActive
                        ? "bg-white/[0.06] ring-1 ring-white/10"
                        : "hover:bg-white/[0.03]"
                    )}
                  >
                    <div
                      className={cn(
                        "font-mono tabular-nums text-[13px] w-12 shrink-0 text-right pt-0.5",
                        verdictTone(h.total_score)
                      )}
                    >
                      {h.total_score}
                      <span className="text-white/30 text-[10px]">/100</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[14px] text-white truncate">
                          {h.owner}
                          <span className="text-white/30 mx-1">/</span>
                          {h.name}
                        </span>
                        <span
                          className="micro-cap glass rounded-full px-2 py-0.5 !text-[9px] inline-flex items-center gap-1"
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
                        {h.language && (
                          <span className="micro-cap glass rounded-full px-2 py-0.5 !text-[9px]">
                            {h.language}
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-white/55 italic line-clamp-1 mt-1">
                        &ldquo;{h.verdict}&rdquo;
                      </div>
                    </div>

                    {isActive && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-white/50 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="h-px bg-white/10" />

            <div className="flex items-center justify-between px-4 py-2 text-[11px] text-white/45 font-mono">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="glass rounded px-1.5 py-0.5">↑</kbd>
                  <kbd className="glass rounded px-1.5 py-0.5">↓</kbd>
                  navigate
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="glass rounded px-1.5 py-0.5">↵</kbd>
                  open
                </span>
              </div>
              <span className="inline-flex items-center gap-1">
                <CommandIcon className="h-3 w-3" />
                K to toggle
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Helper other components can import to open the palette. */
export function openSearchPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("repoglass:open-search"));
  }
}
