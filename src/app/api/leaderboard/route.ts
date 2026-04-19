import { NextRequest, NextResponse } from "next/server";
import { countReposByEvent, listRepos } from "@/lib/store";
import { isValidEventId } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ?event=all              → aggregate (default)
 * ?event=build-a-thon     → scoped to that event
 * ?event=global           → scoped to the Global bucket only
 * Anything else collapses to "all".
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("event") ?? "all";
  const scope = raw === "all" ? "all" : isValidEventId(raw) ? raw : "all";
  const [repos, counts] = await Promise.all([
    listRepos(scope),
    countReposByEvent(),
  ]);
  return NextResponse.json({ repos, counts, event: scope });
}
