"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { EventTabs } from "@/components/event-tabs";
import { Leaderboard } from "@/components/leaderboard";
import type { RepoRecord } from "@/lib/types";
import type { EventId } from "@/lib/events";

type Scope = EventId | "all";

/**
 * Client wrapper: owns the active tab (All / BUILD-A-THON / Global), syncs
 * to the URL (?event=…), fetches filtered repos on change. Leaderboard
 * handles live polling + realtime subs. We also apply an inline text filter
 * here so users can narrow the visible rows without opening ⌘K.
 */
export function LeaderboardSection({
  initial,
  counts: initialCounts,
  highlight,
  initialScope,
}: {
  initial: RepoRecord[];
  counts: Record<string, number>;
  highlight?: string;
  initialScope: Scope;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scope, setScope] = useState<Scope>(initialScope);
  const [repos, setRepos] = useState<RepoRecord[]>(initial);
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/leaderboard?event=${scope}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setRepos(d.repos ?? []);
        setCounts(d.counts ?? {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [scope]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (scope === "all") params.delete("event");
    else params.set("event", scope);
    const qs = params.toString();
    router.replace(`/leaderboard${qs ? `?${qs}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <EventTabs value={scope} onChange={setScope} counts={counts} />
        <div className="micro-cap">
          {repos.length.toString().padStart(2, "0")} visible ·{" "}
          {(counts.all ?? 0).toString().padStart(2, "0")} total
        </div>
      </div>

      <label className="glass rounded-full flex items-center gap-3 px-4 py-2.5 max-w-xl focus-within:ring-1 focus-within:ring-white/20 transition">
        <Search className="h-3.5 w-3.5 text-white/50 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by repo, owner, language, or verdict…"
          className="flex-1 bg-transparent outline-none text-[13px] font-mono placeholder:text-white/35"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear filter"
            onClick={() => setQuery("")}
            className="text-white/40 hover:text-white/80 transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </label>

      <Leaderboard
        initial={repos}
        highlight={highlight}
        scope={scope}
        filter={query}
      />
    </div>
  );
}
