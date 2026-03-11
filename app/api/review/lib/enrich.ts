/**
 * Phase 2: Rich Review Surface — diff enrichment, risk signals, AI summary.
 */

import { GH_API, ghHeaders } from "./shared";

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

// ---------------------------------------------------------------------------
// Risk signal detection (deterministic — no AI needed)
// ---------------------------------------------------------------------------

type RiskSignal = {
  label: string;
  severity: "critical" | "high" | "medium" | "low";
  reason: string;
};

export type PeerReviews = {
  total: number;
  approved: number;
  changes_requested: number;
  commented: number;
};

const RISK_PATTERNS: Array<{
  pattern: RegExp;
  label: string;
  severity: RiskSignal["severity"];
  reason: string;
}> = [
  { pattern: /\.github\/workflows\//i, label: "CI/CD", severity: "critical", reason: "Modifies GitHub Actions workflows" },
  { pattern: /\.github\/actions\//i, label: "CI/CD", severity: "critical", reason: "Modifies custom GitHub Actions" },
  { pattern: /(auth|session|token|jwt|oauth)/i, label: "Auth", severity: "critical", reason: "Touches authentication code" },
  { pattern: /prisma\/(migrations|schema)/i, label: "Database", severity: "high", reason: "Database schema or migration changes" },
  { pattern: /(\.env|secrets|credentials)/i, label: "Secrets", severity: "critical", reason: "May affect secrets or credentials" },
  { pattern: /render\.ya?ml/i, label: "Infra", severity: "high", reason: "Infrastructure configuration" },
  { pattern: /(Dockerfile|docker-compose)/i, label: "Infra", severity: "high", reason: "Container configuration" },
  { pattern: /package(-lock)?\.json|yarn\.lock/i, label: "Dependencies", severity: "medium", reason: "Dependency changes" },
  { pattern: /scripts\//i, label: "Scripts", severity: "high", reason: "Modifies operational scripts" },
  { pattern: /(deploy|release|publish)/i, label: "Deploy", severity: "high", reason: "Deploy-related files" },
  { pattern: /api\//i, label: "API", severity: "medium", reason: "API route changes" },
];

function detectRiskSignals(files: Array<{ filename: string }>): RiskSignal[] {
  const seen = new Set<string>();
  const signals: RiskSignal[] = [];

  for (const file of files) {
    for (const rule of RISK_PATTERNS) {
      if (rule.pattern.test(file.filename) && !seen.has(rule.label)) {
        seen.add(rule.label);
        signals.push({ label: rule.label, severity: rule.severity, reason: rule.reason });
      }
    }
  }

  // Sort by severity
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  signals.sort((a, b) => order[a.severity] - order[b.severity]);
  return signals;
}

const BLAST_RADIUS_RULES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /(auth|session|login)/i, label: "Authentication" },
  { pattern: /(^|\/)api\//i, label: "API endpoints" },
  { pattern: /(^|\/)components\//i, label: "UI components" },
  { pattern: /middleware/i, label: "Request pipeline" },
  { pattern: /(prisma|migrations)/i, label: "Database" },
  { pattern: /(styles|css|theme)/i, label: "Visual styling" },
  { pattern: /(config|env)/i, label: "Configuration" },
  { pattern: /test/i, label: "Test suite" },
];

function detectBlastRadius(files: Array<{ filename: string }>): string[] {
  const labels = new Set<string>();

  for (const file of files) {
    for (const rule of BLAST_RADIUS_RULES) {
      if (rule.pattern.test(file.filename)) {
        labels.add(rule.label);
      }
    }
  }

  return Array.from(labels);
}

// ---------------------------------------------------------------------------
// GitHub diff fetching
// ---------------------------------------------------------------------------

export type PrFile = {
  filename: string;
  status: string; // added, modified, removed, renamed
  additions: number;
  deletions: number;
  patch?: string;
};

export type PrDiff = {
  title: string;
  body: string | null;
  files: PrFile[];
  total_additions: number;
  total_deletions: number;
  total_files: number;
  base_branch: string;
  head_branch: string;
};

export type MergeReadiness = {
  mergeable: boolean | null;
  mergeable_state: string | null;
  checks: Array<{
    name: string;
    status: string;
    conclusion: string | null;
  }>;
  checks_passing: number;
  checks_total: number;
  behind_by: number | null;
};

async function fetchPrDiff(owner: string, repo: string, prNumber: number): Promise<PrDiff | null> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return null;

  try {
    // Fetch PR metadata
    const prRes = await fetch(`${GH_API}/repos/${owner}/${repo}/pulls/${prNumber}`, {
      headers: ghHeaders(githubToken),
    });
    if (!prRes.ok) return null;
    const prData = (await prRes.json()) as {
      title?: string;
      body?: string;
      base?: { ref?: string };
      head?: { ref?: string };
      additions?: number;
      deletions?: number;
      changed_files?: number;
    };

    // Fetch files
    const filesRes = await fetch(`${GH_API}/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100`, {
      headers: ghHeaders(githubToken),
    });
    if (!filesRes.ok) return null;
    const filesData = (await filesRes.json()) as Array<{
      filename: string;
      status: string;
      additions: number;
      deletions: number;
      patch?: string;
    }>;

    return {
      title: prData.title ?? `PR #${prNumber}`,
      body: prData.body ?? null,
      files: filesData.map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch?.slice(0, 2000), // Truncate large patches
      })),
      total_additions: prData.additions ?? filesData.reduce((s, f) => s + f.additions, 0),
      total_deletions: prData.deletions ?? filesData.reduce((s, f) => s + f.deletions, 0),
      total_files: prData.changed_files ?? filesData.length,
      base_branch: prData.base?.ref ?? "main",
      head_branch: prData.head?.ref ?? "unknown",
    };
  } catch {
    return null;
  }
}

async function fetchPeerReviews(owner: string, repo: string, prNumber: number): Promise<PeerReviews | null> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return null;

  try {
    const res = await fetch(`${GH_API}/repos/${owner}/${repo}/pulls/${prNumber}/reviews?per_page=100`, {
      headers: ghHeaders(githubToken),
    });
    if (!res.ok) return null;

    const reviews = (await res.json()) as Array<{ state?: string; user?: { login?: string } }>;
    const latestByUser = new Map<string, string>();

    for (const review of reviews) {
      const user = review.user?.login;
      if (!user) continue;
      latestByUser.set(user, review.state ?? "COMMENTED");
    }

    const totals = {
      total: latestByUser.size,
      approved: 0,
      changes_requested: 0,
      commented: 0,
    };

    for (const state of latestByUser.values()) {
      if (state === "APPROVED") {
        totals.approved += 1;
      } else if (state === "CHANGES_REQUESTED") {
        totals.changes_requested += 1;
      } else {
        totals.commented += 1;
      }
    }

    return totals;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// AI Summary (Gemini 3.1 Flash Lite)
// ---------------------------------------------------------------------------

async function generateAiSummary(diff: PrDiff): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return null;

  // Build a compact prompt with file changes
  const fileList = diff.files
    .map((f) => `${f.status} ${f.filename} (+${f.additions}/-${f.deletions})`)
    .join("\n");

  const patches = diff.files
    .filter((f) => f.patch)
    .slice(0, 10) // Max 10 files
    .map((f) => `--- ${f.filename} ---\n${f.patch}`)
    .join("\n\n")
    .slice(0, 8000); // Token budget

  const prompt = `You are reviewing a pull request for a deployment approval decision.

PR Title: ${diff.title}
PR Description: ${diff.body ?? "(none)"}
Branch: ${diff.head_branch} → ${diff.base_branch}
Files changed: ${diff.total_files} (+${diff.total_additions}/-${diff.total_deletions})

Files:
${fileList}

Key patches:
${patches}

Write a concise summary (2-4 sentences) answering: "What does this change do and should it go live?"
Focus on IMPACT, not implementation details. Be direct. No markdown.`;

  try {
    const res = await fetch(`${GEMINI_API}/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.3 },
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main enrichment function
// ---------------------------------------------------------------------------

export type ReviewEnrichment = {
  diff: PrDiff | null;
  risk_signals: RiskSignal[];
  ai_summary: string | null;
  blast_radius: string[];
  peer_reviews: PeerReviews | null;
};

// Cache enrichment results to avoid regenerating AI summary on every poll.
// Key: "owner/repo#prNumber", TTL: 10 minutes.
const enrichmentCache = new Map<string, { data: ReviewEnrichment; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;
const readinessCache = new Map<string, { data: MergeReadiness | null; expiresAt: number }>();
const READINESS_CACHE_TTL_MS = 30 * 1000;

export async function fetchMergeReadiness(
  owner: string,
  repo: string,
  prNumber: number
): Promise<MergeReadiness | null> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return null;

  const cacheKey = `${owner}/${repo}#${prNumber}:readiness`;
  const cached = readinessCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const prRes = await fetch(`${GH_API}/repos/${owner}/${repo}/pulls/${prNumber}`, {
      headers: ghHeaders(githubToken),
    });
    if (!prRes.ok) return null;

    const prData = (await prRes.json()) as {
      mergeable?: boolean | null;
      mergeable_state?: string | null;
      head?: { sha?: string };
      base?: { sha?: string };
    };

    const headSha = prData.head?.sha;
    const baseSha = prData.base?.sha;
    if (!headSha || !baseSha) return null;

    const [checksRes, compareRes] = await Promise.all([
      fetch(`${GH_API}/repos/${owner}/${repo}/commits/${headSha}/check-runs`, {
        headers: ghHeaders(githubToken),
      }),
      fetch(`${GH_API}/repos/${owner}/${repo}/compare/${baseSha}...${headSha}`, {
        headers: ghHeaders(githubToken),
      }),
    ]);

    if (!checksRes.ok || !compareRes.ok) return null;

    const checksData = (await checksRes.json()) as {
      check_runs?: Array<{
        name?: string;
        status?: string;
        conclusion?: string | null;
      }>;
    };
    const compareData = (await compareRes.json()) as { behind_by?: number };

    const checks = (checksData.check_runs ?? []).map((check) => ({
      name: check.name ?? "Unnamed check",
      status: check.status ?? "queued",
      conclusion: check.conclusion ?? null,
    }));
    const checksPassing = checks.filter(
      (check) => check.status === "completed" && check.conclusion === "success"
    ).length;

    const result: MergeReadiness = {
      mergeable: prData.mergeable ?? null,
      mergeable_state: prData.mergeable_state ?? null,
      checks,
      checks_passing: checksPassing,
      checks_total: checks.length,
      behind_by: compareData.behind_by ?? null,
    };

    readinessCache.set(cacheKey, { data: result, expiresAt: Date.now() + READINESS_CACHE_TTL_MS });
    return result;
  } catch {
    return null;
  }
}

export async function enrichReviewRequest(
  repo: string,
  prNumber: number
): Promise<ReviewEnrichment> {
  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    return { diff: null, risk_signals: [], ai_summary: null, blast_radius: [], peer_reviews: null };
  }

  const cacheKey = `${repo}#${prNumber}`;
  const cached = enrichmentCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const [diff, peerReviews] = await Promise.all([
    fetchPrDiff(owner, repoName, prNumber),
    fetchPeerReviews(owner, repoName, prNumber),
  ]);
  const riskSignals = diff ? detectRiskSignals(diff.files) : [];
  const blastRadius = diff ? detectBlastRadius(diff.files) : [];
  const aiSummary = diff ? await generateAiSummary(diff) : null;

  const result: ReviewEnrichment = {
    diff,
    risk_signals: riskSignals,
    ai_summary: aiSummary,
    blast_radius: blastRadius,
    peer_reviews: peerReviews,
  };

  enrichmentCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}
