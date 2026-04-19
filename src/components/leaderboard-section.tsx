"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EventTabs } from "@/components/event-tabs";
import { Leaderboard } from "@/components/leaderboard";
import type { RepoRecord } from "@/lib/types";
import type { EventId } from "@/lib/events";

type Scope = EventId | "all";

/**
 * Client wrapper: owns the active tab (All / BUILD-A-THON / Global), syncs
 * to the URL (?event=…), fetches filtered repos on change. Leaderboard
 * handles live polling + realtime subs.
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
          Showing {repos.length.toString().padStart(2, "0")} of{" "}
          {(counts.all ?? 0).toString().padStart(2, "0")}
        </div>
      </div>
      <Leaderboard initial={repos} highlight={highlight} scope={scope} />
    </div>
  );
}
