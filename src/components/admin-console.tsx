"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ShieldCheck,
  Search,
  ExternalLink,
  Trash2,
  Save,
  LogOut,
  X,
  Pencil,
  Star,
  GitFork,
} from "lucide-react";
import type { RepoRecord } from "@/lib/types";
import {
  SELECTABLE_EVENTS,
  EVENTS,
  getEvent,
  type EventId,
  isValidEventId,
} from "@/lib/events";
import { ScoreRing } from "@/components/score-ring";
import { Input } from "@/components/ui/input";
import { formatNumber, timeAgo } from "@/lib/utils";

type EditState = {
  id: string;
  event_id: EventId;
  verdict: string;
  total_score: number;
};

export function AdminConsole({ initial }: { initial: RepoRecord[] }) {
  const [repos, setRepos] = useState<RepoRecord[]>(initial);
  const [query, setQuery] = useState("");
  const [filterEvent, setFilterEvent] = useState<EventId | "all">("all");
  const [editing, setEditing] = useState<EditState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return repos.filter((r) => {
      if (filterEvent !== "all" && r.event_id !== filterEvent) return false;
      if (!q) return true;
      return (
        r.owner.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.url.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [repos, query, filterEvent]);

  const refresh = async () => {
    const res = await fetch("/api/admin/repos", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setRepos(d.repos ?? []);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusyId(editing.id);
    try {
      const res = await fetch(`/api/admin/repos/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: editing.event_id,
          verdict: editing.verdict,
          total_score: editing.total_score,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast.success("Saved.");
      setEditing(null);
      await refresh();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async (r: RepoRecord) => {
    const ok = window.confirm(
      `Delete "${r.owner}/${r.name}" from the leaderboard? This cannot be undone.`
    );
    if (!ok) return;
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/admin/repos/${r.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      toast.success(`Removed ${r.owner}/${r.name}`);
      setRepos((prev) => prev.filter((x) => x.id !== r.id));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const signOut = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    toast.success("Signed out.");
    router.push("/admin/login");
    router.refresh();
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: repos.length };
    for (const r of repos) c[r.event_id] = (c[r.event_id] ?? 0) + 1;
    return c;
  }, [repos]);

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl glass grid place-items-center">
            <ShieldCheck className="h-4 w-4 text-[#00F5A0]" />
          </div>
          <div>
            <div className="micro-cap">Admin console</div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em]">
              Manage submissions
            </h1>
          </div>
        </div>
        <button
          onClick={signOut}
          className="droplet h-10 px-4 text-[12px] flex items-center gap-2 text-white/75 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>

      <div className="glass rounded-[22px] p-3 flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] px-3">
          <Search className="h-4 w-4 text-white/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search owner, name, url, description…"
            className="flex-1 border-0 focus:ring-0 text-[13px] font-mono placeholder:text-white/25 h-10 px-0"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setFilterEvent("all")}
            className={`droplet px-3 py-1.5 text-[11px] font-mono ${
              filterEvent === "all" ? "text-white" : "text-white/60"
            }`}
          >
            All <span className="text-white/35 ml-1">{counts.all ?? 0}</span>
          </button>
          {EVENTS.map((e) => (
            <button
              key={e.id}
              onClick={() => setFilterEvent(e.id)}
              className={`droplet px-3 py-1.5 text-[11px] font-mono flex items-center gap-1.5 ${
                filterEvent === e.id ? "text-white" : "text-white/60"
              }`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: e.accent,
                  boxShadow: `0 0 6px ${e.accent}`,
                }}
              />
              {e.label}
              <span className="text-white/35 ml-1">{counts[e.id] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-[22px] p-12 text-center">
          <div className="text-4xl mb-3 text-white/25 font-mono">◌</div>
          <div className="text-white/60">No repositories match.</div>
        </div>
      ) : (
        <div className="glass rounded-[22px] overflow-hidden">
          <div className="hidden md:grid grid-cols-[88px_1fr_180px_200px_180px] gap-3 px-5 py-3 micro-cap border-b border-white/5">
            <div>Score</div>
            <div>Repository</div>
            <div>Event</div>
            <div>Signals</div>
            <div className="text-right">Actions</div>
          </div>
          <ul className="divide-y divide-white/5">
            {filtered.map((r) => {
              const ev = getEvent(r.event_id);
              const disabled = busyId === r.id;
              return (
                <li
                  key={r.id}
                  className="grid grid-cols-1 md:grid-cols-[88px_1fr_180px_200px_180px] gap-3 md:items-center px-5 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div>
                    <ScoreRing score={r.total_score} size={72} stroke={5} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-[14px] truncate">
                      {r.owner}
                      <span className="text-white/30 mx-1">/</span>
                      {r.name}
                    </div>
                    <div className="text-[12px] text-white/50 line-clamp-1 mt-0.5">
                      {r.description || r.verdict || "—"}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/40 font-mono">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" /> {formatNumber(r.stars)}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="h-3 w-3" /> {formatNumber(r.forks)}
                      </span>
                      <span>{timeAgo(r.created_at)}</span>
                    </div>
                  </div>
                  <div>
                    <span
                      className="glass rounded-full inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-mono"
                      title={ev.description}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: ev.accent,
                          boxShadow: `0 0 6px ${ev.accent}`,
                        }}
                      />
                      {ev.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.has_dockerfile && (
                      <span className="micro-cap glass rounded-full px-2 py-0.5 !text-[9px] text-[#7dd3fc]">
                        Docker
                      </span>
                    )}
                    {r.has_ci && (
                      <span className="micro-cap glass rounded-full px-2 py-0.5 !text-[9px] text-[#a5b4fc]">
                        CI
                      </span>
                    )}
                    {r.has_tests && (
                      <span className="micro-cap glass rounded-full px-2 py-0.5 !text-[9px] text-[#00F5A0]">
                        Tests
                      </span>
                    )}
                    {r.has_live_demo && (
                      <span className="micro-cap glass rounded-full px-2 py-0.5 !text-[9px] text-[#f0abfc]">
                        Live
                      </span>
                    )}
                    <span className="micro-cap glass rounded-full px-2 py-0.5 !text-[9px]">
                      {r.analysis_source}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 md:justify-end">
                    <Link
                      href={`/repo/${r.owner}/${r.name}`}
                      className="droplet h-8 px-2.5 text-[11px] flex items-center gap-1 text-white/75 hover:text-white"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </Link>
                    <button
                      onClick={() =>
                        setEditing({
                          id: r.id,
                          event_id: isValidEventId(r.event_id)
                            ? r.event_id
                            : "build-a-thon",
                          verdict: r.verdict,
                          total_score: r.total_score,
                        })
                      }
                      disabled={disabled}
                      className="droplet h-8 px-2.5 text-[11px] flex items-center gap-1 text-white/75 hover:text-white disabled:opacity-50"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(r)}
                      disabled={disabled}
                      className="droplet h-8 px-2.5 text-[11px] flex items-center gap-1 text-[#F87171] hover:text-rose-300 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {editing && (
        <EditDialog
          state={editing}
          setState={setEditing}
          onSave={saveEdit}
          busy={busyId === editing.id}
        />
      )}
    </>
  );
}

function EditDialog({
  state,
  setState,
  onSave,
  busy,
}: {
  state: EditState;
  setState: (s: EditState | null) => void;
  onSave: () => void;
  busy: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm grid place-items-center p-4"
      onClick={() => !busy && setState(null)}
    >
      <div
        className="glass rounded-[24px] p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="micro-cap">Edit submission</div>
            <h2 className="text-lg font-semibold mt-0.5">
              Modify event, verdict, score
            </h2>
          </div>
          <button
            onClick={() => !busy && setState(null)}
            className="droplet h-8 w-8 grid place-items-center"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="micro-cap mb-2 block">Event</label>
            <div className="flex flex-wrap gap-1.5">
              {SELECTABLE_EVENTS.map((e) => {
                const active = state.event_id === e.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setState({ ...state, event_id: e.id })}
                    className={`droplet px-3 py-1.5 text-[11px] font-mono flex items-center gap-1.5 ${
                      active ? "text-white ring-1 ring-white/25" : "text-white/65"
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: e.accent,
                        boxShadow: `0 0 8px ${e.accent}`,
                      }}
                    />
                    {e.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="micro-cap mb-2 block">
              Total score (0–100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={state.total_score}
              onChange={(e) =>
                setState({
                  ...state,
                  total_score: Math.max(
                    0,
                    Math.min(100, Number(e.target.value) || 0)
                  ),
                })
              }
              className="w-full glass rounded-full px-4 h-10 text-[14px] font-mono bg-transparent focus:outline-none focus:ring-2 focus:ring-white/10"
            />
          </div>

          <div>
            <label className="micro-cap mb-2 block">Verdict (1-line)</label>
            <textarea
              value={state.verdict}
              onChange={(e) =>
                setState({ ...state, verdict: e.target.value })
              }
              rows={3}
              maxLength={500}
              className="w-full glass rounded-[18px] px-4 py-3 text-[13px] bg-transparent focus:outline-none focus:ring-2 focus:ring-white/10 resize-none"
            />
            <div className="micro-cap mt-1 text-right">
              {state.verdict.length}/500
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={() => setState(null)}
            disabled={busy}
            className="droplet h-9 px-4 text-[12px] text-white/70 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={busy}
            className="droplet droplet-solid h-9 px-4 text-[12px] font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
