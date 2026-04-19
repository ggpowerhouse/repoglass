"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Github, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { parseGithubUrl } from "@/lib/utils";
import { DEFAULT_EVENT, type EventId } from "@/lib/events";
import { EventPicker } from "@/components/event-picker";

const EXAMPLES = [
  "vercel/next.js",
  "openai/openai-node",
  "shadcn-ui/ui",
];

export function SubmitForm({
  defaultEvent = DEFAULT_EVENT,
}: {
  defaultEvent?: EventId;
}) {
  const [url, setUrl] = useState("");
  const [eventId, setEventId] = useState<EventId>(defaultEvent);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (target: string) => {
    const full = target.startsWith("http")
      ? target
      : `https://github.com/${target}`;
    const parsed = parseGithubUrl(full);
    if (!parsed) {
      toast.error("Paste a valid github.com/<owner>/<repo> URL");
      return;
    }
    setLoading(true);
    const id = toast.loading(`Judging ${parsed.owner}/${parsed.repo}…`);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: full, event_id: eventId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      toast.success(`Scored ${data.repo.total_score}/100`, {
        id,
        description: data.repo.verdict ?? data.repo.ai_summary,
      });
      const slug = data.slug ?? `${data.repo.owner}/${data.repo.name}`;
      router.push(`/repo/${slug}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong", {
        id,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3 }}
      className="w-full max-w-2xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(url);
        }}
        className="glass glass-hover rounded-full p-1.5 pl-5 flex items-center gap-2 focus-within:border-white/25 focus-within:shadow-[0_24px_60px_-20px_rgba(108,93,211,0.35)] transition-shadow"
      >
        <Github className="h-4 w-4 text-white/50 shrink-0" />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          autoComplete="off"
          spellCheck={false}
          disabled={loading}
          className="flex-1 min-w-0 border-0 focus:ring-0 text-[15px] font-mono placeholder:text-white/25 h-11 px-0"
        />
        <EventPicker value={eventId} onChange={setEventId} disabled={loading} />
        <button
          type="submit"
          disabled={loading}
          className="droplet droplet-solid h-11 px-5 text-sm font-semibold flex items-center gap-2 shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Judging
            </>
          ) : (
            <>
              Analyze
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="micro-cap">Try</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setUrl(`https://github.com/${ex}`);
              submit(ex);
            }}
            disabled={loading}
            className="droplet px-3 py-1 text-[11px] font-mono text-white/65 hover:text-white disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
