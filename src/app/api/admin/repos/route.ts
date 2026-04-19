import { NextResponse } from "next/server";
import { listRepos } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const repos = await listRepos("all");
  return NextResponse.json({ repos });
}
