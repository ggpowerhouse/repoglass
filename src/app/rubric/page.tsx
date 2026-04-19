import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/nav";
import { PILLARS, PARAMS_BY_PILLAR, type PillarKey } from "@/lib/rubric";

export default function RubricPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="aurora-bg opacity-40" />
      <div className="absolute inset-0 grid-bg z-0" />
      <Nav />

      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-10 pb-24">
        <Link
          href="/"
          className="droplet inline-flex items-center gap-1.5 px-3 py-1.5 mb-6"
        >
          <ArrowLeft className="h-3 w-3" />
          <span className="micro-cap !text-white/60">Home</span>
        </Link>

        <div className="micro-cap mb-3">The rubric</div>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] text-gradient">
          How we judge
        </h1>
        <p className="text-white/60 mt-3 max-w-2xl">
          Every submission is scored on 16 parameters across 4 pillars. Each
          parameter is 0-10; pillars cap at 25; total is out of 100. The judge
          must cite evidence from the repo for every score.
        </p>

        <div className="mt-8 glass rounded-2xl p-5 text-sm text-white/70 leading-relaxed">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
            Judging voice
          </div>
          Blunt. Founder-grade. Grades on whether the thing should exist — not
          on effort. Generous where deserved, brutal where earned. No
          benefit-of-the-doubt: if a builder wants a 10, they have to leave
          signal in the repo.
        </div>

        <div className="mt-10 space-y-6">
          {(Object.keys(PILLARS) as PillarKey[]).map((k) => {
            const meta = PILLARS[k];
            const params = PARAMS_BY_PILLAR[k];
            return (
              <div key={k} className="glass rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{meta.icon}</span>
                      <h2 className="text-xl font-semibold">{meta.label}</h2>
                    </div>
                    <p className="text-sm text-white/50">{meta.subtitle}</p>
                  </div>
                  <div className="text-right text-xs text-white/40">
                    <div className="font-mono text-lg text-white">25 pts</div>
                    pillar cap
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {params.map((p) => (
                    <div
                      key={p.key}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                    >
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-[12px] text-white/55 mt-1 leading-relaxed">
                        {p.description}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-md border border-rose-500/20 bg-rose-500/5 p-2">
                          <div className="text-rose-300/80 font-mono mb-1">
                            1/10
                          </div>
                          <div className="text-white/60">{p.anchor1}</div>
                        </div>
                        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2">
                          <div className="text-emerald-300/80 font-mono mb-1">
                            10/10
                          </div>
                          <div className="text-white/60">{p.anchor10}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 glass rounded-2xl p-6 text-sm text-white/70 leading-relaxed">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
            How scores become a total
          </div>
          For each pillar: sum the 4 parameters (each 0-10), divide by 40,
          multiply by 25 → pillar subtotal (0-25). Sum the 4 pillars → total
          (0-100). The LLM proposes raw parameter scores; the server does the
          math. Model hallucinations in arithmetic are structurally impossible.
        </div>
      </section>
    </main>
  );
}
