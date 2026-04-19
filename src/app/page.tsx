import Link from "next/link";
import { Nav } from "@/components/nav";
import { SubmitForm } from "@/components/submit-form";
import { Trophy, ScrollText, ArrowRight } from "lucide-react";
import { PILLARS, PARAMS_BY_PILLAR, type PillarKey } from "@/lib/rubric";

export default function Home() {
  const pillars = Object.keys(PILLARS) as PillarKey[];

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Ambient aurora + lenses — the only color on the page */}
      <div className="aurora-bg" />
      <div className="absolute inset-0 grid-bg z-0" />
      <div
        className="lens lens-indigo"
        style={{ width: "48vw", height: "48vw", top: "-10vw", left: "-8vw" }}
      />
      <div
        className="lens lens-jade"
        style={{ width: "40vw", height: "40vw", bottom: "-12vw", right: "-6vw" }}
      />

      <Nav />

      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-24 md:pt-32 pb-28 text-center">
        <div
          className="glass rounded-full px-4 py-1.5 mb-10 animate-fade-up opacity-0 shine"
          style={{ animationDelay: "0.05s" }}
        >
          <span className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00F5A0] animate-pulse" />
            <span className="micro-cap !text-white/70">
              16 parameters · Evidence-cited · Live
            </span>
          </span>
        </div>

        <h1
          className="text-[44px] sm:text-6xl md:text-[88px] font-semibold tracking-[-0.04em] leading-[0.95] max-w-5xl animate-fade-up opacity-0"
          style={{ animationDelay: "0.15s" }}
        >
          <span className="text-gradient">Drop a repo.</span>
          <br />
          <span className="text-gradient-aurora">Get judged like a founder.</span>
        </h1>

        <p
          className="mt-7 max-w-2xl text-white/55 text-base md:text-lg leading-relaxed animate-fade-up opacity-0"
          style={{ animationDelay: "0.25s" }}
        >
          RepoGlass reads your project — code, README, CI, commits, demo —
          and grades it across{" "}
          <span className="text-white/85">4 pillars and 16 parameters</span>.
          Every score comes with reasoning and evidence.{" "}
          <span className="text-white/85">No hand-waving. No vibes.</span>
        </p>

        <div
          className="mt-11 w-full flex justify-center animate-fade-up opacity-0"
          style={{ animationDelay: "0.35s" }}
        >
          <SubmitForm />
        </div>

        <div
          className="mt-12 flex flex-wrap gap-2.5 justify-center animate-fade-up opacity-0"
          style={{ animationDelay: "0.5s" }}
        >
          <Link
            href="/leaderboard"
            className="droplet px-4 py-2 text-[12px] inline-flex items-center gap-1.5 text-white/80 hover:text-white"
          >
            <Trophy className="h-3.5 w-3.5" />
            Live leaderboard
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href="/rubric"
            className="droplet px-4 py-2 text-[12px] inline-flex items-center gap-1.5 text-white/70 hover:text-white"
          >
            <ScrollText className="h-3.5 w-3.5" />
            See the rubric
          </Link>
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-28">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="micro-cap mb-2">The rubric</div>
            <h2 className="text-2xl md:text-4xl font-semibold tracking-[-0.02em]">
              Four pillars. Sixteen questions.
            </h2>
            <p className="text-white/45 text-sm mt-1.5 max-w-xl">
              Not vibes. Evidence. Every parameter has a floor (1/10) and a
              ceiling (10/10), and every score cites what we saw in the repo.
            </p>
          </div>
          <Link
            href="/rubric"
            className="droplet px-4 py-2 text-[12px] hidden md:inline-flex items-center gap-1.5 text-white/70 hover:text-white"
          >
            Full anchors
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pillars.map((k) => {
            const meta = PILLARS[k];
            const params = PARAMS_BY_PILLAR[k];
            return (
              <div
                key={k}
                className="glass glass-hover rounded-[24px] p-5 relative overflow-hidden group"
              >
                <div
                  className={`absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${meta.tone} to-transparent blur-[48px] opacity-60 group-hover:opacity-100 transition-opacity duration-700`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl drop-shadow-sm">{meta.icon}</div>
                    <div className="micro-cap">25 pts</div>
                  </div>
                  <div className="mt-3 text-[15px] font-semibold tracking-tight">
                    {meta.label}
                  </div>
                  <div className="text-[11px] text-white/45 leading-relaxed mt-0.5">
                    {meta.subtitle}
                  </div>
                  <div className="hairline my-4" />
                  <ul className="space-y-1.5">
                    {params.map((p) => (
                      <li
                        key={p.key}
                        className="text-[12px] text-white/65 font-mono flex items-center gap-2"
                      >
                        <span className="h-1 w-1 rounded-full bg-white/40" />
                        {p.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="relative z-10 px-6 pb-10 text-center micro-cap">
        Judged blunt · Judged with receipts · Next.js · OpenAI · Supabase
      </footer>
    </main>
  );
}
