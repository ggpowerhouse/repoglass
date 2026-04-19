import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { RepoRecord } from "./types";
import { DEFAULT_EVENT, isValidEventId, type EventId } from "./events";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && (SUPABASE_ANON || SUPABASE_SERVICE)
);

let _server: SupabaseClient | null = null;
export function getServerSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (_server) return _server;
  _server = createClient(SUPABASE_URL!, (SUPABASE_SERVICE || SUPABASE_ANON)!, {
    auth: { persistSession: false },
  });
  return _server;
}

export function getBrowserSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (!SUPABASE_URL || !SUPABASE_ANON) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
  });
}

type GlobalMem = {
  __repoglassMem?: { rows: RepoRecord[] };
};
const g = globalThis as unknown as GlobalMem;
if (!g.__repoglassMem) g.__repoglassMem = { rows: [] };

// Migrate any rows that still carry decommissioned event ids → "global".
for (const row of g.__repoglassMem!.rows) {
  if (!isValidEventId((row as RepoRecord).event_id)) {
    (row as RepoRecord).event_id = "global";
  }
}

/**
 * Normalize legacy rows: anything without a valid event_id, or with a
 * decommissioned event (hack-the-north, internal-demo), collapses to "global".
 */
function hydrate(
  rec: RepoRecord | (Omit<RepoRecord, "event_id"> & { event_id?: string })
): RepoRecord {
  const raw = (rec as { event_id?: string }).event_id;
  const ev: EventId = isValidEventId(raw) ? raw : "global";
  return { ...(rec as RepoRecord), event_id: ev };
}

export const mem = {
  all(): RepoRecord[] {
    return [...g.__repoglassMem!.rows]
      .map(hydrate)
      .sort((a, b) => b.total_score - a.total_score);
  },
  upsert(rec: RepoRecord) {
    const rows = g.__repoglassMem!.rows;
    const i = rows.findIndex((r) => r.url === rec.url);
    if (i >= 0) rows[i] = rec;
    else rows.unshift(rec);
  },
  update(id: string, patch: Partial<RepoRecord>): RepoRecord | null {
    const rows = g.__repoglassMem!.rows;
    const i = rows.findIndex((r) => r.id === id);
    if (i < 0) return null;
    rows[i] = { ...rows[i], ...patch };
    return rows[i];
  },
  delete(id: string): boolean {
    const rows = g.__repoglassMem!.rows;
    const i = rows.findIndex((r) => r.id === id);
    if (i < 0) return false;
    rows.splice(i, 1);
    return true;
  },
  get(url: string): RepoRecord | undefined {
    const r = g.__repoglassMem!.rows.find((r) => r.url === url);
    return r ? hydrate(r) : undefined;
  },
  getBySlug(owner: string, name: string): RepoRecord | undefined {
    const url = `https://github.com/${owner}/${name}`.toLowerCase();
    const r = g.__repoglassMem!.rows.find(
      (r) => r.url.toLowerCase() === url
    );
    return r ? hydrate(r) : undefined;
  },
  getById(id: string): RepoRecord | undefined {
    const r = g.__repoglassMem!.rows.find((r) => r.id === id);
    return r ? hydrate(r) : undefined;
  },
};

function toDbRow(rec: RepoRecord) {
  return {
    id: rec.id,
    url: rec.url,
    event_id: rec.event_id,
    owner: rec.owner,
    name: rec.name,
    author: rec.author,
    avatar_url: rec.avatar_url,
    description: rec.description,
    stars: rec.stars,
    forks: rec.forks,
    language: rec.language,
    languages: rec.languages,
    topics: rec.topics,
    scores: rec.scores,
    pillar_subtotals: rec.pillar_subtotals,
    total_score: rec.total_score,
    ai_summary: rec.ai_summary,
    verdict: rec.verdict,
    strengths: rec.strengths,
    weaknesses: rec.weaknesses,
    moat: rec.moat,
    pivot_suggestion: rec.pivot_suggestion,
    red_flags: rec.red_flags,
    green_flags: rec.green_flags,
    has_dockerfile: rec.has_dockerfile,
    has_ci: rec.has_ci,
    has_tests: rec.has_tests,
    has_live_demo: rec.has_live_demo,
    readme_length: rec.readme_length,
    contributors_signal: rec.contributors_signal,
    pivot_signal: rec.pivot_signal,
    analysis_source: rec.analysis_source,
    created_at: rec.created_at,
  };
}

export async function saveRepo(rec: RepoRecord): Promise<RepoRecord> {
  mem.upsert(rec);
  const sb = getServerSupabase();
  if (!sb) return rec;
  const { error } = await sb
    .from("repositories")
    .upsert(toDbRow(rec), { onConflict: "url" });
  if (error) console.error("Supabase upsert error:", error);
  return rec;
}

/**
 * Filter repositories by event.
 *  - "all"    → aggregate every row (used by the Global tab and the admin)
 *  - EventId  → only rows for that event (including the "global" bucket)
 */
let _migrationRan = false;
async function runOneShotMigration(sb: SupabaseClient) {
  if (_migrationRan) return;
  _migrationRan = true;
  try {
    await sb
      .from("repositories")
      .update({ event_id: "global" })
      .in("event_id", ["hack-the-north", "internal-demo"]);
  } catch (e) {
    console.error("event_id migration skipped:", e);
  }
}

export async function listRepos(
  scope: EventId | "all" = "all"
): Promise<RepoRecord[]> {
  const sb = getServerSupabase();
  if (!sb) {
    const rows = mem.all();
    if (scope === "all") return rows;
    return rows.filter((r) => r.event_id === scope);
  }
  await runOneShotMigration(sb);

  let q = sb
    .from("repositories")
    .select("*")
    .order("total_score", { ascending: false })
    .limit(200);

  if (scope !== "all") q = q.eq("event_id", scope);

  const { data, error } = await q;
  if (error) {
    console.error("Supabase list error:", error);
    return mem.all();
  }
  return ((data as RepoRecord[]) ?? []).map(hydrate);
}

/** Count repos per event. "all" = total across every bucket. */
export async function countReposByEvent(): Promise<Record<string, number>> {
  const rows = await listRepos("all");
  const counts: Record<string, number> = { all: rows.length };
  for (const r of rows) {
    counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
  }
  return counts;
}

export async function getRepoBySlug(
  owner: string,
  name: string
): Promise<RepoRecord | null> {
  const sb = getServerSupabase();
  if (!sb) return mem.getBySlug(owner, name) ?? null;
  const url = `https://github.com/${owner}/${name}`;
  const { data, error } = await sb
    .from("repositories")
    .select("*")
    .ilike("url", url)
    .single();
  if (error) return mem.getBySlug(owner, name) ?? null;
  return hydrate(data as RepoRecord);
}

export async function getRepoById(id: string): Promise<RepoRecord | null> {
  const sb = getServerSupabase();
  if (!sb) return mem.getById(id) ?? null;
  const { data, error } = await sb
    .from("repositories")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return mem.getById(id) ?? null;
  return hydrate(data as RepoRecord);
}

export async function updateRepo(
  id: string,
  patch: Partial<RepoRecord>
): Promise<RepoRecord | null> {
  // Guard: only allow a safe subset of keys to be modified via admin
  const allowed: (keyof RepoRecord)[] = [
    "event_id",
    "verdict",
    "ai_summary",
    "total_score",
    "description",
  ];
  const safePatch: Partial<RepoRecord> = {};
  for (const k of allowed) {
    if (k in patch) (safePatch as Record<string, unknown>)[k] = patch[k];
  }
  if ("event_id" in safePatch && !isValidEventId(safePatch.event_id)) {
    safePatch.event_id = DEFAULT_EVENT;
  }

  const current = mem.getById(id);
  if (!current) return null;
  const next: RepoRecord = { ...current, ...safePatch };
  mem.update(id, safePatch);

  const sb = getServerSupabase();
  if (sb) {
    const { error } = await sb
      .from("repositories")
      .update(safePatch)
      .eq("id", id);
    if (error) console.error("Supabase update error:", error);
  }
  return next;
}

export async function deleteRepo(id: string): Promise<boolean> {
  const ok = mem.delete(id);
  const sb = getServerSupabase();
  if (sb) {
    const { error } = await sb.from("repositories").delete().eq("id", id);
    if (error) {
      console.error("Supabase delete error:", error);
      return ok;
    }
  }
  return ok;
}
