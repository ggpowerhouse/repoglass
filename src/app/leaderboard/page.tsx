import { Suspense } from "react";
import { Nav } from "@/components/nav";
import { SubmitForm } from "@/components/submit-form";
import { LeaderboardSection } from "@/components/leaderboard-section";
import { countReposByEvent, listRepos } from "@/lib/store";
import { isValidEventId, type EventId } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string; event?: string }>;
}) {
  const params = await searchParams;
  const raw = params.event;
  const scope: EventId | "all" =
    raw && isValidEventId(raw) ? raw : "all";

  const [repos, counts] = await Promise.all([
    listRepos(scope),
    countReposByEvent(),
  ]);
  const top = repos[0];

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="aurora-bg opacity-70" />
      <div className="absolute inset-0 grid-bg z-0" />
      <Nav />

      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-14 pb-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <div className="glass inline-flex items-center gap-2.5 rounded-full px-3 py-1.5 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00F5A0] animate-pulse" />
              <span className="micro-cap !text-white/70">
                Live · auto-refreshing
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] text-gradient">
              Leaderboard
            </h1>
            <p className="text-white/50 mt-3 text-sm font-mono">
              {repos.length.toString().padStart(2, "0")}{" "}
              {repos.length === 1 ? "repo" : "repos"} judged
              <span className="text-white/25 mx-2">·</span>
              top score{" "}
              <span className="text-white">
                {top?.total_score ?? 0}
                <span className="text-white/30">/100</span>
              </span>
              <span className="text-white/25 mx-2">·</span>
              16 parameters · evidence-cited
            </p>
          </div>

          <div className="w-full md:w-auto md:min-w-[420px]">
            <SubmitForm
              defaultEvent={scope === "all" ? "build-a-thon" : scope}
            />
          </div>
        </div>

        <Suspense fallback={<div className="text-white/40">Loading…</div>}>
          <LeaderboardSection
            initial={repos}
            counts={counts}
            highlight={params.highlight}
            initialScope={scope}
          />
        </Suspense>
      </section>
    </main>
  );
}
