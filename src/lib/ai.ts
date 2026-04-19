import OpenAI from "openai";
import { z } from "zod";
import type { RepoContext, Scores, PillarSubtotals } from "./types";
import {
  PARAM_KEYS,
  pillarSubtotal,
  RUBRIC,
  totalFromScores,
  type ParamKey,
} from "./rubric";

const ParamScoreSchema = z.object({
  score: z.number().min(0).max(10),
  reasoning: z.string().min(15).max(500),
  evidence: z.array(z.string()).min(0).max(5),
});

const ScoresSchema = z.object(
  Object.fromEntries(PARAM_KEYS.map((k) => [k, ParamScoreSchema])) as Record<
    ParamKey,
    typeof ParamScoreSchema
  >
) as z.ZodType<Scores>;

const ResponseSchema = z.object({
  scores: ScoresSchema,
  summary: z.string().min(30).max(600),
  verdict: z.string().min(20).max(220),
  strengths: z.array(z.string()).min(1).max(5),
  weaknesses: z.array(z.string()).min(0).max(5),
  red_flags: z.array(z.string()).min(0).max(5),
  green_flags: z.array(z.string()).min(0).max(5),
  moat: z.string().min(20).max(500),
  pivot_suggestion: z.string().min(20).max(500),
});

export type AnalysisResult = {
  scores: Scores;
  pillar_subtotals: PillarSubtotals;
  total: number;
  summary: string;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  red_flags: string[];
  green_flags: string[];
  moat: string;
  pivot_suggestion: string;
  source: "llm" | "heuristic";
};

const SYSTEM_PROMPT = `You are NIKHIL KAMATH judging a BUILD-A-THON project.

Your voice: blunt, contrarian, founder-grade. You do not grade on effort.
You grade on WHETHER THE THING SHOULD EXIST, whether a builder has clarity,
and whether the execution is real. Generous where deserved, brutal where earned.

You score a GitHub repository on 16 parameters across 4 pillars.
Each parameter is scored 0-10 with calibrated anchors.

For EVERY parameter you MUST:
  1. Give a single integer score 0-10.
  2. Give 1-3 sentences of reasoning that REFERENCE SPECIFIC EVIDENCE from
     the repo context (file names, commit messages, README phrases, stars,
     topics, languages, presence/absence of Docker/CI/tests/demo).
  3. List 0-5 short evidence bullets naming the signal (e.g. "Dockerfile present",
     "README is 230 chars — thin", "commit: 'pivot to Next.js'").

If a parameter cannot be judged from repo signals alone (e.g. user empathy,
evidence of research), PENALIZE the lack of evidence — do not give benefit of
the doubt. A hackathon builder who wants a 10 must leave signal.

ANCHORS (calibration):
- 0-2: broken, missing, or actively harmful
- 3-4: present but weak
- 5-6: competent, typical for a hackathon
- 7-8: clearly strong, better than average
- 9-10: venture-grade, top 5% of what you see

OUTPUT FIELDS beyond the scores:
- summary: exactly TWO sentences, plain English, no hype.
- verdict: one punchy founder-mode line. E.g. "Real product hiding behind a
  weak README. Fix distribution before writing more code."
- strengths / weaknesses: 2-4 terse bullets each.
- red_flags: concrete risks (security, legal, abandonment, no moat).
- green_flags: concrete positive signals (traction, community, depth).
- moat: what would make this defensible? Be honest — say "no moat" if true.
- pivot_suggestion: if you were mentoring this builder, what would you tell
  them to change next week? Be specific.

Return STRICT JSON matching the schema. Do not wrap in markdown.`;

function buildUserPayload(ctx: RepoContext): string {
  const payload = {
    repo: ctx.full_name,
    description: ctx.description,
    homepage: ctx.homepage,
    stars: ctx.stars,
    forks: ctx.forks,
    watchers: ctx.watchers,
    open_issues: ctx.open_issues,
    language: ctx.language,
    languages: ctx.languages,
    topics: ctx.topics,
    license: ctx.license,
    created_at: ctx.created_at,
    pushed_at: ctx.pushed_at,
    contributors_count: ctx.contributors_count,
    recent_commits: ctx.recent_commits,
    commit_messages_sample: ctx.commit_messages_sample,
    issues_sample: ctx.issues_sample,
    pivot_signal: ctx.pivot_signal,
    signals: {
      has_dockerfile: ctx.has_dockerfile,
      has_ci: ctx.has_ci,
      has_tests: ctx.has_tests,
      has_live_demo: ctx.has_live_demo,
      readme_length: ctx.readme.length,
      file_count: ctx.file_tree.length,
    },
    file_tree: ctx.file_tree,
    package_manifest: ctx.package_manifest,
    readme: ctx.readme,
    rubric: RUBRIC.map((r) => ({
      key: r.key,
      pillar: r.pillar,
      label: r.label,
      description: r.description,
      anchors: { 1: r.anchor1, 10: r.anchor10 },
    })),
  };
  return JSON.stringify(payload, null, 2).slice(0, 28_000);
}

export async function analyzeRepo(ctx: RepoContext): Promise<AnalysisResult> {
  // Accept either OPENAI_API_KEY (OpenAI) or LLM_API_KEY (any OpenAI-compatible
  // provider like Groq, Together, Fireworks, OpenRouter). Both are optional —
  // without them we fall back to the deterministic heuristic scorer.
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return heuristicAnalyze(ctx);
  }

  try {
    const baseURL = process.env.LLM_BASE_URL || undefined; // e.g. https://api.groq.com/openai/v1
    const client = new OpenAI({ apiKey, baseURL });
    // LLM_MODEL wins; fall back to OPENAI_MODEL; finally to a safe OpenAI default.
    const model =
      process.env.LLM_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";

    const resp = await client.chat.completions.create({
      model,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content:
            "Judge this repository. Return only JSON per the schema:\n\n" +
            buildUserPayload(ctx),
        },
      ],
    });

    const raw = resp.choices[0]?.message?.content ?? "{}";
    const parsed = ResponseSchema.parse(JSON.parse(raw));

    // Clamp and integer-ize scores server-side.
    const scores = Object.fromEntries(
      PARAM_KEYS.map((k) => [
        k,
        {
          score: Math.max(0, Math.min(10, Math.round(parsed.scores[k].score))),
          reasoning: parsed.scores[k].reasoning,
          evidence: parsed.scores[k].evidence,
        },
      ])
    ) as Scores;

    const pillar_subtotals: PillarSubtotals = {
      foundation: pillarSubtotal(scores, "foundation"),
      build: pillarSubtotal(scores, "build"),
      impact: pillarSubtotal(scores, "impact"),
      builder: pillarSubtotal(scores, "builder"),
    };
    const total = totalFromScores(scores);

    return {
      scores,
      pillar_subtotals,
      total,
      summary: parsed.summary,
      verdict: parsed.verdict,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      red_flags: parsed.red_flags,
      green_flags: parsed.green_flags,
      moat: parsed.moat,
      pivot_suggestion: parsed.pivot_suggestion,
      source: "llm",
    };
  } catch (err) {
    console.error("LLM scoring failed, falling back to heuristic:", err);
    return heuristicAnalyze(ctx);
  }
}

// ---------------- Heuristic (works with zero API keys) ----------------

function clamp10(n: number) {
  return Math.max(0, Math.min(10, Math.round(n)));
}

export function heuristicAnalyze(ctx: RepoContext): AnalysisResult {
  const descLower = `${ctx.description ?? ""} ${ctx.topics.join(" ")}`.toLowerCase();
  const readmeLower = ctx.readme.toLowerCase();
  const hasPainLanguage = /\b(problem|painful|frustrat|struggle|waste|slow)\b/.test(
    readmeLower
  );
  const hasPersona = /\b(developer|founder|student|designer|pm|parent|user|team)\b/.test(
    readmeLower
  );
  const novelKeywords = [
    "ai",
    "ml",
    "agent",
    "llm",
    "edge",
    "realtime",
    "wasm",
    "decentralized",
    "zero",
    "self-host",
  ];
  const novelHits = novelKeywords.filter((k) => descLower.includes(k)).length;
  const hasInterviews = /\b(interview|survey|user research|feedback)\b/.test(
    readmeLower
  );
  const hasMetrics = /\b\d+\s*(users|customers|downloads|requests|k\/s|qps|%)\b/.test(
    readmeLower
  );
  const hasBuildSection = /##?\s*(install|getting started|usage|quickstart)/i.test(
    ctx.readme
  );
  const hasRoadmap = /##?\s*(roadmap|future|todo|plans)/i.test(ctx.readme);
  const hasPricing = /\b(pricing|subscription|plan|free tier|paid)\b/.test(
    readmeLower
  );
  const hasEthics = /\b(privacy|security|gdpr|consent|safety|ethic)\b/.test(
    readmeLower
  );
  const starBoost = Math.min(3, Math.log10(Math.max(1, ctx.stars)));
  const solidTeam = ctx.contributors_count >= 3;

  const mk = (
    score: number,
    reasoning: string,
    evidence: string[]
  ) => ({ score: clamp10(score), reasoning, evidence });

  const scores: Scores = {
    // Foundation
    problemDepth: mk(
      (hasPainLanguage ? 6 : 3) +
        (ctx.description && ctx.description.length > 40 ? 1 : 0) +
        (novelHits > 0 ? 1 : 0) +
        starBoost * 0.4,
      hasPainLanguage
        ? "README uses pain-language, suggesting a real problem target."
        : "README does not articulate a sharp pain — reads as a tool demo.",
      [
        ctx.description ? `description: "${ctx.description.slice(0, 80)}"` : "no description",
        hasPainLanguage ? "pain-keyword match in README" : "no pain keywords found",
      ]
    ),
    userEmpathy: mk(
      (hasPersona ? 5 : 2) + (hasInterviews ? 3 : 0) + (solidTeam ? 1 : 0),
      hasPersona
        ? "A persona is named in the README, giving the build a target."
        : "No named user persona — empathy is assumed, not demonstrated.",
      [
        hasPersona ? "persona keyword in README" : "no persona keywords",
        hasInterviews ? "mentions interviews / user research" : "no research mentioned",
      ]
    ),
    originality: mk(
      4 + Math.min(4, novelHits * 1.5) + (ctx.topics.length >= 3 ? 1 : 0) + starBoost * 0.3,
      novelHits
        ? `Positions against novel vectors (${novelKeywords.filter((k) => descLower.includes(k)).join(", ")}).`
        : "Description reads as a standard project in a crowded category.",
      [
        `topics: ${ctx.topics.slice(0, 5).join(", ") || "none"}`,
        `novel-keyword hits: ${novelHits}`,
      ]
    ),
    evidenceOfResearch: mk(
      (hasInterviews ? 5 : 1) + (hasMetrics ? 4 : 1) + (ctx.issues_sample.length > 3 ? 1 : 0),
      hasMetrics || hasInterviews
        ? "README cites concrete numbers or user research — signal that the 'why' was pressure-tested."
        : "No evidence of validation before building. Assumption-first build.",
      [
        hasMetrics ? "metrics referenced in README" : "no metrics in README",
        hasInterviews ? "user research mentioned" : "no research signals",
        `${ctx.issues_sample.length} issues sampled`,
      ]
    ),

    // Build
    functionalMvp: mk(
      3 +
        (ctx.has_live_demo ? 4 : 0) +
        (ctx.package_manifest ? 1 : 0) +
        (hasBuildSection ? 2 : 0) +
        (ctx.recent_commits >= 5 ? 1 : 0),
      ctx.has_live_demo
        ? `Live demo at ${ctx.homepage} — the loop actually runs.`
        : "No live demo URL; judge cannot verify the core loop without cloning.",
      [
        ctx.has_live_demo ? `homepage: ${ctx.homepage}` : "no homepage set",
        ctx.package_manifest ? "manifest present" : "no package manifest",
        hasBuildSection ? "README has install/usage section" : "no install steps",
      ]
    ),
    toolMastery: mk(
      3 +
        Math.min(4, Object.keys(ctx.languages).length) +
        (ctx.has_dockerfile ? 1 : 0) +
        (ctx.has_ci ? 1 : 0) +
        starBoost * 0.3,
      `${Object.keys(ctx.languages).length} languages, ${
        ctx.has_ci ? "CI configured" : "no CI"
      }, ${ctx.has_dockerfile ? "Dockerized" : "no Docker"}.`,
      [
        `languages: ${Object.keys(ctx.languages).slice(0, 4).join(", ") || "unknown"}`,
        ctx.has_dockerfile ? "Dockerfile present" : "no Dockerfile",
        ctx.has_ci ? "GitHub Actions / CI present" : "no CI workflows",
      ]
    ),
    uxIntuition: mk(
      3 +
        (ctx.has_live_demo ? 3 : 0) +
        (hasBuildSection ? 2 : 0) +
        (ctx.readme.length > 2000 ? 2 : 0),
      ctx.has_live_demo
        ? "Live demo means a user can click-test the flow without setup friction."
        : "UX is hypothesis-only; no artifact to evaluate intuitively.",
      [
        ctx.has_live_demo ? "live demo URL" : "no live demo",
        hasBuildSection ? "clear quickstart in README" : "no quickstart",
      ]
    ),
    executability: mk(
      3 +
        (ctx.has_dockerfile ? 2 : 0) +
        (ctx.has_ci ? 2 : 0) +
        (ctx.has_live_demo ? 2 : 0) +
        (ctx.license ? 1 : 0),
      ctx.has_dockerfile && ctx.has_ci && ctx.has_live_demo
        ? "Docker + CI + live demo — could ship to real users this week."
        : "Ship-path is incomplete; missing one of Docker / CI / live demo.",
      [
        ctx.has_dockerfile ? "Dockerfile" : "no Dockerfile",
        ctx.has_ci ? "CI workflow" : "no CI",
        ctx.has_live_demo ? "live demo" : "no live demo",
        ctx.license ? `license: ${ctx.license}` : "no license",
      ]
    ),

    // Impact
    valueProp: mk(
      (hasPainLanguage ? 4 : 2) +
        (ctx.has_live_demo ? 2 : 0) +
        (hasMetrics ? 2 : 0) +
        starBoost * 0.5,
      hasPainLanguage && ctx.has_live_demo
        ? "Pain articulated and demo runs — value is demonstrable, not just claimed."
        : "Value proposition is asserted but not stress-tested against a real user.",
      [
        hasPainLanguage ? "pain language in README" : "soft value claims",
        ctx.has_live_demo ? "demo exists to prove value" : "no demo to prove value",
        `${ctx.stars} stars`,
      ]
    ),
    scalability: mk(
      3 +
        (ctx.has_dockerfile ? 2 : 0) +
        (ctx.has_ci ? 2 : 0) +
        (ctx.has_tests ? 2 : 0) +
        starBoost * 0.3,
      ctx.has_dockerfile && ctx.has_tests
        ? "Containerized with tests — can handle real user load without a rewrite."
        : "Architecture gives no signal it can survive 1,000 concurrent users.",
      [
        ctx.has_dockerfile ? "stateless-friendly via Docker" : "no Docker",
        ctx.has_tests ? "tests present" : "no tests",
      ]
    ),
    sustainability: mk(
      2 +
        (hasPricing ? 4 : 0) +
        (hasRoadmap ? 2 : 0) +
        (solidTeam ? 1 : 0) +
        starBoost * 0.3,
      hasPricing || hasRoadmap
        ? "README hints at monetization or roadmap — a life beyond demo day is planned."
        : "No visible plan for how this continues or pays for itself.",
      [
        hasPricing ? "pricing/monetization mentioned" : "no pricing mentioned",
        hasRoadmap ? "roadmap section present" : "no roadmap",
        `${ctx.contributors_count} contributors`,
      ]
    ),
    safety: mk(
      2 + (hasEthics ? 5 : 0) + (ctx.license ? 2 : 0),
      hasEthics
        ? "Privacy / security considerations are called out explicitly."
        : "No visible thought given to privacy, misuse, or safety surfaces.",
      [
        hasEthics ? "safety/privacy keyword in README" : "no safety keywords",
        ctx.license ? `license: ${ctx.license}` : "no license",
      ]
    ),

    // Builder
    resourcefulness: mk(
      4 +
        Math.min(3, Math.log10(Math.max(1, ctx.recent_commits))) +
        (Object.keys(ctx.languages).length >= 3 ? 2 : 0),
      ctx.recent_commits > 10
        ? "Active commit cadence suggests the builder pushed through blockers rather than around them."
        : "Thin commit history; hard to evaluate scrappiness.",
      [`${ctx.recent_commits} recent commits`, `${Object.keys(ctx.languages).length} languages used`]
    ),
    pivotAgility: mk(
      ctx.pivot_signal ? 8 : 4,
      ctx.pivot_signal
        ? "Commit history contains pivot/rewrite/refactor language — the builder adapted mid-stream."
        : "No evidence of scope adaptation. Could be clarity — or could be stubbornness.",
      ctx.pivot_signal
        ? [
            `pivot commit: "${ctx.commit_messages_sample.find((m) => /(pivot|rewrite|refactor)/i.test(m)) ?? ""}"`,
          ]
        : ["no pivot/rewrite commits detected"]
    ),
    technicalCuriosity: mk(
      3 +
        Math.min(4, Object.keys(ctx.languages).length) +
        (novelHits > 0 ? 2 : 0),
      novelHits > 0
        ? "Engaged with modern/novel tech stacks (AI/edge/realtime/etc) — stretched beyond comfort."
        : "Stack is conventional; no evidence of reach.",
      [
        `languages: ${Object.keys(ctx.languages).slice(0, 3).join(", ") || "unknown"}`,
        `novel tech hits: ${novelHits}`,
      ]
    ),
    collaboration: mk(
      ctx.contributors_count <= 1
        ? 3
        : Math.min(10, 4 + ctx.contributors_count * 1.5),
      ctx.contributors_count <= 1
        ? "Solo carry — no 'we' in the commit log."
        : `${ctx.contributors_count} contributors visible; team signal is present.`,
      [`${ctx.contributors_count} contributors`]
    ),
  };

  const pillar_subtotals: PillarSubtotals = {
    foundation: pillarSubtotal(scores, "foundation"),
    build: pillarSubtotal(scores, "build"),
    impact: pillarSubtotal(scores, "impact"),
    builder: pillarSubtotal(scores, "builder"),
  };
  const total = totalFromScores(scores);

  const strengths: string[] = [];
  if (ctx.has_dockerfile) strengths.push("Dockerized — easy to run anywhere");
  if (ctx.has_ci) strengths.push("CI pipeline configured");
  if (ctx.has_tests) strengths.push("Automated tests present");
  if (ctx.has_live_demo) strengths.push(`Live demo: ${ctx.homepage}`);
  if (ctx.readme.length > 2000) strengths.push("Rich, detailed README");
  if (ctx.contributors_count >= 3) strengths.push("Team signal in commit log");
  if (strengths.length === 0) strengths.push("Public, buildable repository");

  const weaknesses: string[] = [];
  if (!ctx.has_tests) weaknesses.push("No tests — fragile at scale");
  if (!ctx.has_dockerfile) weaknesses.push("No Dockerfile — friction to run");
  if (ctx.readme.length < 600) weaknesses.push("README is thin on the 'why'");
  if (!ctx.has_live_demo) weaknesses.push("No live demo — claims are unverified");
  if (!hasPricing && !hasRoadmap) weaknesses.push("No sustainability plan");

  const red_flags: string[] = [];
  if (!ctx.license) red_flags.push("No license — unusable by anyone else");
  if (!hasEthics) red_flags.push("Zero mention of privacy or safety");
  if (ctx.readme.length < 200) red_flags.push("README is essentially empty");

  const green_flags: string[] = [];
  if (ctx.stars > 100) green_flags.push(`${ctx.stars} stars — external validation`);
  if (ctx.has_live_demo) green_flags.push("Shippable: live demo exists");
  if (ctx.pivot_signal) green_flags.push("Evidence of adaptation in commits");
  if (ctx.contributors_count >= 3) green_flags.push("Multiple contributors");

  const summary =
    `${ctx.full_name} is a ${ctx.language ?? "polyglot"} project` +
    (ctx.description ? ` tackling ${ctx.description.toLowerCase()}. ` : ". ") +
    `Heuristic scoring puts it at ${total}/100 — ${
      total >= 80
        ? "strong signal overall."
        : total >= 60
        ? "solid bones with clear gaps."
        : "early; the 'why' needs more pressure."
    }`;

  const verdictParts: string[] = [];
  if (total >= 80) verdictParts.push("Real product hiding inside a hackathon repo.");
  else if (total >= 60) verdictParts.push("Working demo, unclear wedge.");
  else verdictParts.push("Fun build, not yet a product.");
  if (!ctx.has_live_demo) verdictParts.push("Ship the demo first, everything else second.");
  else if (!hasPricing) verdictParts.push("Decide what you're charging for before you add a feature.");
  const verdict = verdictParts.join(" ");

  const moat =
    novelHits >= 2
      ? "Moat is in the stack choice and category positioning — defensible if the builder goes deep on one vertical."
      : ctx.stars > 500
      ? "Moat is early distribution; community is the asset."
      : "No visible moat yet. The builder needs a wedge — a user segment no one else serves well.";

  const pivot_suggestion = !ctx.has_live_demo
    ? "Spin up a live demo on Vercel/Railway this weekend. A demo changes every conversation."
    : ctx.readme.length < 800
    ? "Rewrite the README with a 3-line 'for whom, why, how' at the top. Before another feature."
    : !hasPricing
    ? "Put a pricing page up — even fake. Forces clarity on the user you're actually building for."
    : "Ship to 10 real users this week. Read their first 3 messages in your inbox. Build only what they ask twice.";

  return {
    scores,
    pillar_subtotals,
    total,
    summary,
    verdict,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    red_flags: red_flags.slice(0, 4),
    green_flags: green_flags.slice(0, 4),
    moat,
    pivot_suggestion,
    source: "heuristic",
  };
}
