// 4 pillars x 4 parameters. Each parameter scored 0-10, then summed and
// normalized so the total is always out of 100 (each pillar weighted 25).
//
// This is the public, judge-facing rubric used for display, prompting,
// and the heuristic fallback.

export type PillarKey = "foundation" | "build" | "impact" | "builder";
export type ParamKey =
  // Pillar 1 — Foundation
  | "problemDepth"
  | "userEmpathy"
  | "originality"
  | "evidenceOfResearch"
  // Pillar 2 — Build
  | "functionalMvp"
  | "toolMastery"
  | "uxIntuition"
  | "executability"
  // Pillar 3 — Impact
  | "valueProp"
  | "scalability"
  | "sustainability"
  | "safety"
  // Pillar 4 — Builder
  | "resourcefulness"
  | "pivotAgility"
  | "technicalCuriosity"
  | "collaboration";

export type Param = {
  key: ParamKey;
  pillar: PillarKey;
  label: string;
  description: string;
  anchor1: string; // what a 1/10 looks like
  anchor10: string; // what a 10/10 looks like
};

export const PILLARS: Record<
  PillarKey,
  { label: string; icon: string; subtitle: string; tone: string }
> = {
  foundation: {
    label: "Foundation",
    icon: "🏗️",
    subtitle: "Problem & Ideation — the 'Why'",
    tone: "from-indigo-400/40",
  },
  build: {
    label: "Build",
    icon: "🛠️",
    subtitle: "Execution & Functionality — the 'How'",
    tone: "from-fuchsia-400/40",
  },
  impact: {
    label: "Impact",
    icon: "🚀",
    subtitle: "Utility & Viability — the 'So What'",
    tone: "from-cyan-400/40",
  },
  builder: {
    label: "Builder",
    icon: "👤",
    subtitle: "Mindset & Growth — the 'Who'",
    tone: "from-emerald-400/40",
  },
};

export const RUBRIC: Param[] = [
  // Foundation
  {
    key: "problemDepth",
    pillar: "foundation",
    label: "Problem Depth",
    description: "Real, painful problem vs. a mild inconvenience.",
    anchor1: "Trivial or invented problem",
    anchor10: "High-impact, universal, hair-on-fire pain",
  },
  {
    key: "userEmpathy",
    pillar: "foundation",
    label: "User Empathy",
    description: "Clear understanding of the target persona.",
    anchor1: "Vague, mythical user",
    anchor10: "Deep psychological insight, named persona",
  },
  {
    key: "originality",
    pillar: "foundation",
    label: "Originality",
    description: "Fresh take vs. a standard clone.",
    anchor1: "Another to-do / another wrapper",
    anchor10: "Genuinely novel angle or niche",
  },
  {
    key: "evidenceOfResearch",
    pillar: "foundation",
    label: "Evidence of Research",
    description: "Validated with users or data, not assumptions.",
    anchor1: "No evidence, pure vibes",
    anchor10: "Data-backed, user-interview-driven",
  },

  // Build
  {
    key: "functionalMvp",
    pillar: "build",
    label: "Functional MVP",
    description: "Does the core loop actually work end-to-end?",
    anchor1: "Broken or mocked-only",
    anchor10: "Fully operational core loop, runs today",
  },
  {
    key: "toolMastery",
    pillar: "build",
    label: "Tool Mastery",
    description:
      "Effective use of code, AI, infra, or no-code orchestration (not just imported).",
    anchor1: "Barely using the stack",
    anchor10: "Expert-level orchestration of the right tools",
  },
  {
    key: "uxIntuition",
    pillar: "build",
    label: "UX / UI Intuition",
    description: "Is the interface obvious, even to a first-time user?",
    anchor1: "Confusing, requires a manual",
    anchor10: "Grandma-proof; self-evident affordances",
  },
  {
    key: "executability",
    pillar: "build",
    label: "Executability",
    description: "How realistic is it to launch this tomorrow?",
    anchor1: "Purely theoretical",
    anchor10: "Ship-ready: domain, infra, pricing in place",
  },

  // Impact
  {
    key: "valueProp",
    pillar: "impact",
    label: "Value Proposition",
    description: "Saves time, money, or creates clear joy.",
    anchor1: "No obvious benefit",
    anchor10: "High ROI, user would pay or beg for access",
  },
  {
    key: "scalability",
    pillar: "impact",
    label: "Scalability",
    description: "Survives 100, 1,000, 100k users without rewrites.",
    anchor1: "Manual / single-tenant / fragile",
    anchor10: "Built for growth; stateless, observable",
  },
  {
    key: "sustainability",
    pillar: "impact",
    label: "Sustainability",
    description: "A plan to continue existing — revenue, grants, or community.",
    anchor1: "No plan beyond demo day",
    anchor10: "Clear monetization or sustaining model",
  },
  {
    key: "safety",
    pillar: "impact",
    label: "Ethics & Safety",
    description: "Data privacy, misuse, bias — considered and mitigated.",
    anchor1: "Ignored; obvious risk surface",
    anchor10: "Proactive safeguards documented",
  },

  // Builder
  {
    key: "resourcefulness",
    pillar: "builder",
    label: "Resourcefulness",
    description: "How cleverly did they overcome blockers?",
    anchor1: "Gave up at first wall",
    anchor10: "Elegant workarounds, scrappy genius",
  },
  {
    key: "pivotAgility",
    pillar: "builder",
    label: "Pivot Agility",
    description: "Evidence of adapting the idea when data demanded it.",
    anchor1: "Linear, stubborn scope",
    anchor10: "Visible iteration / scope adaptation",
  },
  {
    key: "technicalCuriosity",
    pillar: "builder",
    label: "Technical Curiosity",
    description: "Did they push their own edge (new tool, API, concept)?",
    anchor1: "Stayed deep in comfort zone",
    anchor10: "Reached well beyond prior skill",
  },
  {
    key: "collaboration",
    pillar: "builder",
    label: "Collaboration",
    description:
      "Evidence of team signal in the repo — contributors, PRs, issues, credits.",
    anchor1: "Solo carry with no sharing",
    anchor10: "Strong team signal, clean division of labor",
  },
];

export const PARAMS_BY_PILLAR: Record<PillarKey, Param[]> = {
  foundation: RUBRIC.filter((p) => p.pillar === "foundation"),
  build: RUBRIC.filter((p) => p.pillar === "build"),
  impact: RUBRIC.filter((p) => p.pillar === "impact"),
  builder: RUBRIC.filter((p) => p.pillar === "builder"),
};

export const PARAM_KEYS = RUBRIC.map((r) => r.key) as ParamKey[];

// Each pillar caps at 25 pts: (sum of 4 params, each 0-10) * 25/40 = 0-25.
export function pillarSubtotal(
  scores: Record<ParamKey, { score: number }>,
  pillar: PillarKey
): number {
  const params = PARAMS_BY_PILLAR[pillar];
  const raw = params.reduce((acc, p) => acc + (scores[p.key]?.score ?? 0), 0);
  return Math.round((raw / 40) * 25);
}

export function totalFromScores(
  scores: Record<ParamKey, { score: number }>
): number {
  return (
    pillarSubtotal(scores, "foundation") +
    pillarSubtotal(scores, "build") +
    pillarSubtotal(scores, "impact") +
    pillarSubtotal(scores, "builder")
  );
}

export function verdictLabel(total: number): {
  label: string;
  tone: string;
  tagline: string;
} {
  if (total >= 90)
    return {
      label: "Venture-Grade",
      tone: "text-emerald-300",
      tagline: "This could raise a seed round. Ship it this week.",
    };
  if (total >= 80)
    return {
      label: "Strong Signal",
      tone: "text-indigo-300",
      tagline: "Real product inside. Sharpen the wedge and go to market.",
    };
  if (total >= 70)
    return {
      label: "Promising Prototype",
      tone: "text-cyan-300",
      tagline: "Bones are right. Close the loop on UX and distribution.",
    };
  if (total >= 55)
    return {
      label: "Functional Demo",
      tone: "text-amber-300",
      tagline: "Works, but not yet a product. Find the painful user first.",
    };
  if (total >= 35)
    return {
      label: "Early Sketch",
      tone: "text-orange-300",
      tagline: "Seed of an idea. Validate the 'why' before more code.",
    };
  return {
    label: "Needs Rework",
    tone: "text-rose-300",
    tagline: "Reset. Talk to 10 users before the next line of code.",
  };
}
