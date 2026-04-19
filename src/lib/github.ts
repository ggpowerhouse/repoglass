import { Octokit } from "@octokit/rest";
import type { RepoContext } from "./types";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: "RepoGlass/1.0",
});

const MAX_README_CHARS = 18_000;
const MAX_TREE_ENTRIES = 250;
const MAX_COMMIT_MSGS = 30;

function b64decode(content: string): string {
  try {
    return Buffer.from(content, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

const PIVOT_KEYWORDS =
  /\b(pivot|refactor|rewrite|v2|rebuild|migrate|overhaul|redesign|switch to|moving from)\b/i;

export async function fetchRepoContext(
  owner: string,
  repo: string
): Promise<RepoContext> {
  const { data: r } = await octokit.repos.get({ owner, repo });

  const [langRes, readmeRes, treeRes, contribRes, commitsRes, issuesRes] =
    await Promise.allSettled([
      octokit.repos.listLanguages({ owner, repo }),
      octokit.repos.getReadme({ owner, repo }),
      octokit.git.getTree({
        owner,
        repo,
        tree_sha: r.default_branch,
        recursive: "true",
      }),
      octokit.repos.listContributors({ owner, repo, per_page: 10 }),
      octokit.repos.listCommits({ owner, repo, per_page: MAX_COMMIT_MSGS }),
      octokit.issues.listForRepo({
        owner,
        repo,
        state: "all",
        per_page: 10,
      }),
    ]);

  const languages =
    langRes.status === "fulfilled"
      ? (langRes.value.data as Record<string, number>)
      : {};

  const readmeRaw =
    readmeRes.status === "fulfilled" && readmeRes.value.data.content
      ? b64decode(readmeRes.value.data.content)
      : "";
  const readme = readmeRaw.slice(0, MAX_README_CHARS);

  const tree =
    treeRes.status === "fulfilled" ? treeRes.value.data.tree ?? [] : [];
  const filePaths = tree
    .filter((t) => t.type === "blob" && typeof t.path === "string")
    .map((t) => t.path as string);

  const prioritized = [
    ...filePaths.filter((p) => !p.includes("/")),
    ...filePaths.filter(
      (p) =>
        /dockerfile/i.test(p) ||
        /\.ya?ml$/i.test(p) ||
        /^\.github\//i.test(p) ||
        /test/i.test(p) ||
        /spec/i.test(p)
    ),
  ];
  const file_tree = Array.from(new Set(prioritized)).slice(0, MAX_TREE_ENTRIES);

  const has_dockerfile = filePaths.some((p) => /(^|\/)dockerfile$/i.test(p));
  const has_ci = filePaths.some(
    (p) =>
      /^\.github\/workflows\//i.test(p) ||
      /\.gitlab-ci\.ya?ml$/i.test(p) ||
      /^\.circleci\//i.test(p)
  );
  const has_tests = filePaths.some(
    (p) =>
      /(^|\/)(tests?|__tests__|spec|cypress|e2e)\//i.test(p) ||
      /\.(test|spec)\.[tj]sx?$/i.test(p)
  );
  const has_live_demo = Boolean(r.homepage && r.homepage.startsWith("http"));

  let package_manifest: string | null = null;
  const manifestPath = filePaths.find((p) =>
    /^(package\.json|pyproject\.toml|requirements\.txt|Cargo\.toml|go\.mod|Gemfile|composer\.json)$/i.test(
      p
    )
  );
  if (manifestPath) {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: manifestPath,
      });
      if (!Array.isArray(data) && data.type === "file" && "content" in data) {
        package_manifest = b64decode(data.content).slice(0, 4000);
      }
    } catch {
      /* non-fatal */
    }
  }

  const contributors_count =
    contribRes.status === "fulfilled" ? contribRes.value.data.length : 0;

  const commit_messages_sample =
    commitsRes.status === "fulfilled"
      ? commitsRes.value.data
          .map((c) => c.commit.message.split("\n")[0])
          .filter(Boolean)
          .slice(0, MAX_COMMIT_MSGS)
      : [];
  const recent_commits = commit_messages_sample.length;
  const pivot_signal = commit_messages_sample.some((m) => PIVOT_KEYWORDS.test(m));

  const issues_sample =
    issuesRes.status === "fulfilled"
      ? issuesRes.value.data
          .filter((i) => !i.pull_request)
          .map((i) => i.title)
          .slice(0, 10)
      : [];

  return {
    owner,
    name: r.name,
    full_name: r.full_name,
    description: r.description,
    stars: r.stargazers_count ?? 0,
    forks: r.forks_count ?? 0,
    watchers: r.subscribers_count ?? 0,
    open_issues: r.open_issues_count ?? 0,
    language: r.language,
    languages,
    topics: r.topics ?? [],
    license: r.license?.spdx_id ?? null,
    homepage: r.homepage,
    created_at: r.created_at ?? new Date().toISOString(),
    updated_at: r.updated_at ?? new Date().toISOString(),
    pushed_at: r.pushed_at ?? new Date().toISOString(),
    default_branch: r.default_branch,
    avatar_url: r.owner?.avatar_url ?? null,
    author: r.owner?.login ?? owner,
    readme,
    file_tree,
    has_dockerfile,
    has_ci,
    has_tests,
    has_live_demo,
    package_manifest,
    contributors_count,
    recent_commits,
    commit_messages_sample,
    pivot_signal,
    issues_sample,
  };
}
