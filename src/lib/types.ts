import type { ParamKey, PillarKey } from "./rubric";
import type { EventId } from "./events";

export type ParamScore = {
  score: number; // 0-10
  reasoning: string; // 1-3 sentences, evidence-based
  evidence: string[]; // concrete signals cited from the repo (files, stats, lines)
};

export type Scores = Record<ParamKey, ParamScore>;

export type PillarSubtotals = Record<PillarKey, number>; // out of 25

// Kept for backwards compat with the old leaderboard record shape.
export type LegacyScoreBreakdown = {
  codeQuality: number;
  innovation: number;
  biasForAction: number;
  documentation: number;
};

export type RepoRecord = {
  id: string;
  url: string;
  event_id: EventId;
  owner: string;
  name: string;
  author: string;
  avatar_url: string | null;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  languages: Record<string, number>;
  topics: string[];

  // New 16-dimension scoring
  scores: Scores;
  pillar_subtotals: PillarSubtotals;
  total_score: number;

  // Narrative layer
  ai_summary: string; // 2 sentences
  verdict: string; // 1-line Nikhil-style take
  strengths: string[];
  weaknesses: string[];
  moat: string; // what makes this defensible or not
  pivot_suggestion: string; // "if I were building this, I'd..."
  red_flags: string[];
  green_flags: string[];

  // Signals from repo
  has_dockerfile: boolean;
  has_ci: boolean;
  has_tests: boolean;
  has_live_demo: boolean;
  readme_length: number;
  contributors_signal: number; // heuristic
  pivot_signal: boolean;

  analysis_source: "llm" | "heuristic";
  created_at: string;
};

export type RepoContext = {
  owner: string;
  name: string;
  full_name: string;
  description: string | null;
  stars: number;
  forks: number;
  watchers: number;
  open_issues: number;
  language: string | null;
  languages: Record<string, number>;
  topics: string[];
  license: string | null;
  homepage: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  default_branch: string;
  avatar_url: string | null;
  author: string;
  readme: string;
  file_tree: string[];
  has_dockerfile: boolean;
  has_ci: boolean;
  has_tests: boolean;
  has_live_demo: boolean;
  package_manifest: string | null;
  contributors_count: number;
  recent_commits: number;
  commit_messages_sample: string[];
  pivot_signal: boolean;
  issues_sample: string[];
};
