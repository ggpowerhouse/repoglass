import { NextRequest, NextResponse } from "next/server";
import { deleteRepo, getRepoById, updateRepo } from "@/lib/store";
import { isValidEventId } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const rec = await getRepoById(id);
  if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ repo: rec });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Sanitize inputs server-side.
  const patch: Record<string, unknown> = {};
  if ("event_id" in body) {
    if (!isValidEventId(body.event_id)) {
      return NextResponse.json(
        { error: "Invalid event_id" },
        { status: 400 }
      );
    }
    patch.event_id = body.event_id;
  }
  if (typeof body.verdict === "string") patch.verdict = body.verdict.slice(0, 500);
  if (typeof body.ai_summary === "string")
    patch.ai_summary = body.ai_summary.slice(0, 1000);
  if (typeof body.description === "string")
    patch.description = body.description.slice(0, 1000);
  if (typeof body.total_score === "number") {
    const n = Math.max(0, Math.min(100, Math.round(body.total_score)));
    patch.total_score = n;
  }

  const updated = await updateRepo(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ repo: updated });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const ok = await deleteRepo(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
