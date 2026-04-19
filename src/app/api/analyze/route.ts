import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { parseGithubUrl } from "@/lib/utils";
import { fetchRepoContext } from "@/lib/github";
import { analyzeRepo } from "@/lib/ai";
import { saveRepo } from "@/lib/store";
import type { RepoRecord } from "@/lib/types";
import { normalizeEventId } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: { url?: string; event_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const event_id = normalizeEventId(body.event_id);
  const parsed = parseGithubUrl(body.url ?? "");
  if (!parsed) {
    return NextResponse.json(
      { error: "Provide a valid https://github.com/<owner>/<repo> URL." },
      { status: 400 }
    );
  }

  const { owner, repo } = parsed;
  const url = `https://github.com/${owner}/${repo}`;

  try {
    const ctx = await fetchRepoContext(owner, repo);
    const analysis = await analyzeRepo(ctx);

    const record: RepoRecord = {
      id: randomUUID(),
      url,
      event_id,
      owner: ctx.owner,
      name: ctx.name,
      author: ctx.author,
      avatar_url: ctx.avatar_url,
      description: ctx.description,
      stars: ctx.stars,
      forks: ctx.forks,
      language: ctx.language,
      languages: ctx.languages,
      topics: ctx.topics,
      scores: analysis.scores,
      pillar_subtotals: analysis.pillar_subtotals,
      total_score: analysis.total,
      ai_summary: analysis.summary,
      verdict: analysis.verdict,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      red_flags: analysis.red_flags,
      green_flags: analysis.green_flags,
      moat: analysis.moat,
      pivot_suggestion: analysis.pivot_suggestion,
      has_dockerfile: ctx.has_dockerfile,
      has_ci: ctx.has_ci,
      has_tests: ctx.has_tests,
      has_live_demo: ctx.has_live_demo,
      readme_length: ctx.readme.length,
      contributors_signal: ctx.contributors_count,
      pivot_signal: ctx.pivot_signal,
      analysis_source: analysis.source,
      created_at: new Date().toISOString(),
    };

    const saved = await saveRepo(record);
    return NextResponse.json({
      repo: saved,
      analysis_source: analysis.source,
      slug: `${ctx.owner}/${ctx.name}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status =
      /not found/i.test(msg) ? 404 : /rate limit/i.test(msg) ? 429 : 500;
    console.error("Analyze error:", err);
    return NextResponse.json(
      {
        error:
          status === 404
            ? "Repository not found or not public."
            : status === 429
            ? "GitHub rate limit hit. Add a GITHUB_TOKEN to .env.local."
            : `Analysis failed: ${msg}`,
      },
      { status }
    );
  }
}
