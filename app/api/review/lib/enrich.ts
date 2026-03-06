/**
 * Phase 2: Rich Review Surface — diff enrichment, risk signals, AI summary.
 */

const GH_API = "https://api.github.com";
const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

function ghHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// ---------------------------------------------------------------------------
// Risk signal detection (deterministic — no AI needed)
// ---------------------------------------------------------------------------

type RiskSignal = {
  label: string;
  severity: "critical" | "high" | "medium" | "low";
  reason: string;
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
};

export async function enrichReviewRequest(
  repo: string,
  prNumber: number
): Promise<ReviewEnrichment> {
  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    return { diff: null, risk_signals: [], ai_summary: null };
  }

  const diff = await fetchPrDiff(owner, repoName, prNumber);
  const riskSignals = diff ? detectRiskSignals(diff.files) : [];
  const aiSummary = diff ? await generateAiSummary(diff) : null;

  return {
    diff,
    risk_signals: riskSignals,
    ai_summary: aiSummary,
  };
}
