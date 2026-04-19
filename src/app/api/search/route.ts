import { NextRequest, NextResponse } from "next/server";
import { listRepos } from "@/lib/store";
import type { RepoRecord } from "@/lib/types";
import { isValidEventId, type EventId } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Strict whitelist of the fields we expose through search.
// Never leak scoring internals, evidence strings, or timestamps here.
type SearchHit = {
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

function toHit(r: RepoRecord): SearchHit {
  return {
    id: r.id,
    slug: `${r.owner}/${r.name}`,
    url: r.url,
    owner: r.owner,
    name: r.name,
    author: r.author,
    description: r.description,
    total_score: r.total_score,
    event_id: r.event_id,
    verdict: r.verdict,
    language: r.language,
  };
}

/**
 * Rank a repo against a query. Higher score = better match.
 * Weighted in order of user intent: exact slug > name > owner > verdict > desc.
 */
function rank(r: RepoRecord, q: string): number {
  if (!q) return r.total_score; // empty q: return highest-scored first
  const lower = (s: string | null | undefined) => (s ?? "").toLowerCase();
  const slug = `${r.owner}/${r.name}`.toLowerCase();
  const name = lower(r.name);
  const owner = lower(r.owner);
  const verdict = lower(r.verdict);
  const desc = lower(r.description);

  let score = 0;
  if (slug === q) score += 1000;
  else if (slug.startsWith(q)) score += 500;
  else if (slug.includes(q)) score += 200;

  if (name === q) score += 400;
  else if (name.startsWith(q)) score += 200;
  else if (name.includes(q)) score += 80;

  if (owner === q) score += 150;
  else if (owner.startsWith(q)) score += 70;
  else if (owner.includes(q)) score += 30;

  if (verdict.includes(q)) score += 20;
  if (desc.includes(q)) score += 10;

  // Gentle tiebreaker on total_score so better-rated repos edge out ties.
  return score > 0 ? score + r.total_score / 100 : 0;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("q") ?? "";
  const scopeRaw = req.nextUrl.searchParams.get("event") ?? "all";
  const limitRaw = req.nextUrl.searchParams.get("limit") ?? "8";

  const q = raw.trim().toLowerCase().slice(0, 80);
  const scope: EventId | "all" =
    scopeRaw === "all" ? "all" : isValidEventId(scopeRaw) ? scopeRaw : "all";
  const limit = Math.max(1, Math.min(25, parseInt(limitRaw, 10) || 8));

  const all = await listRepos(scope);

  const scored = all
    .map((r) => ({ r, s: rank(r, q) }))
    .filter((x) => x.s > 0 || !q)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ r }) => toHit(r));

  return NextResponse.json({
    q,
    scope,
    total: all.length,
    hits: scored,
  });
}
