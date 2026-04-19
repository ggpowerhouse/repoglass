/**
 * Events registry — groups leaderboards.
 *
 * Only two buckets exist right now:
 *  - build-a-thon: the flagship event (default for fresh submissions)
 *  - global:       a selectable home for everything else; also acts as the
 *                  "show all" view on the leaderboard.
 *
 * To introduce more events later, append them here. The rest of the app
 * (picker, tabs, admin) reads from this single source of truth.
 */

export type EventId = "build-a-thon" | "global";

export type EventDef = {
  id: EventId;
  label: string;
  description: string;
  accent: string; // hex used for dots, glows, chips
};

export const EVENTS: EventDef[] = [
  {
    id: "build-a-thon",
    label: "BUILD-A-THON",
    description: "The flagship in-house builder sprint.",
    accent: "#00F5A0",
  },
  {
    id: "global",
    label: "Global",
    description: "Open pool — everything outside a specific event.",
    accent: "#8B7FEA",
  },
];

export const DEFAULT_EVENT: EventId = "build-a-thon";

export function isValidEventId(v: unknown): v is EventId {
  return v === "build-a-thon" || v === "global";
}

export function normalizeEventId(v: unknown): EventId {
  return isValidEventId(v) ? v : DEFAULT_EVENT;
}

export function getEvent(id: EventId): EventDef {
  return EVENTS.find((e) => e.id === id) ?? EVENTS[0];
}

/**
 * The submit dropdown shows both options — users explicitly pick where
 * their repo belongs. The leaderboard treats "global" as the aggregated view.
 */
export const SELECTABLE_EVENTS: EventDef[] = EVENTS;
