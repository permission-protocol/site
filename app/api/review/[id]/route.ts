import { NextResponse } from "next/server";
import { enrichReviewRequest, fetchMergeReadiness } from "../lib/enrich";
import { GH_API, ghHeaders, fetchRequestDetails } from "../lib/shared";

type PrInfo = {
  author: string | null;
  merged: boolean;
  merge_commit_sha: string | null;
  head_sha: string | null;
  state: string; // "open" | "closed"
  title: string | null;
};

/**
 * Fetch PR info from GitHub (author, merge status, title).
 */
async function fetchPrInfo(repo: string, prNumber: number): Promise<PrInfo | null> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return null;
  try {
    const res = await fetch(`${GH_API}/repos/${repo}/pulls/${prNumber}`, {
      headers: ghHeaders(githubToken),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: { login?: string };
      merged?: boolean;
      merge_commit_sha?: string;
      head?: { sha?: string };
      state?: string;
      title?: string;
    };
    return {
      author: data.user?.login ?? null,
      merged: data.merged ?? false,
      merge_commit_sha: data.merge_commit_sha ?? null,
      head_sha: data.head?.sha ?? null,
      state: data.state ?? "unknown",
      title: data.title ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Map PP API deploy-request fields to the frontend ReviewRequest shape.
 */
function mapToReviewRequest(raw: any, prInfo?: PrInfo | null) {
  const owner = raw.repo?.split("/")[0];
  const repoName = raw.repo?.split("/")[1];
  return {
    id: raw.id,
    action: raw.capability || raw.action || "Unknown",
    resource: raw.repo || raw.resource || "Unknown",
    actor: prInfo?.author || raw.createdByRef || raw.actor || raw.requested_by || "CI",
    requested_by: prInfo?.author || raw.createdByRef || raw.requested_by,
    risk_tier: raw.env === "production" ? "high" : raw.env === "staging" ? "medium" : "low",
    scope: raw.env ? `${raw.env} — ${raw.ref || ""}`.trim() : raw.scope,
    timestamp: raw.createdAt || raw.created_at,
    created_at: raw.createdAt || raw.created_at,
    status: raw.status,
    supersededByRequestId: raw.supersededByRequestId ?? null,
    approval_status: raw.approvalStatus,
    commit_sha: raw.commitSha,
    pr_merged: prInfo?.merged ?? false,
    pr_merge_sha: prInfo?.merge_commit_sha ?? null,
    pr_state: prInfo?.state ?? null,
    github_pr: raw.prNumber
      ? {
          owner,
          repo: repoName,
          pr_number: raw.prNumber,
          title: prInfo?.title || `PR #${raw.prNumber}`,
          description: raw.reason || null,
          files_changed: [],
        }
      : undefined,
  };
}

/**
 * Fetch Vercel preview deployment URL for a GitHub PR (if available).
 */
async function fetchVercelPreview(repo: string, prNumber: number): Promise<string | null> {
  const vercelToken = process.env.VERCEL_TOKEN;
  if (!vercelToken) return null;

  // Only look for previews for repos deployed on Vercel
  const repoName = repo.split("/").pop()?.toLowerCase();
  if (repoName !== "permissionprotocol-site") return null;

  try {
    // Search deployments by meta.githubPrId
    const res = await fetch(
      `https://api.vercel.com/v6/deployments?meta-githubPrId=${prNumber}&limit=1&state=READY`,
      { headers: { Authorization: `Bearer ${vercelToken}` } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { deployments?: { url?: string }[] };
    const dep = data.deployments?.[0];
    return dep?.url ? `https://${dep.url}` : null;
  } catch {
    return null;
  }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const match = await fetchRequestDetails(params.id);
    if (!match) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    // Fetch PR info from GitHub (author + merge status)
    const prInfo = match.prNumber && match.repo
      ? await fetchPrInfo(match.repo, match.prNumber)
      : null;

    // Phase 2: Enrich with diff, risk signals, and AI summary
    const enrichment = match.prNumber && match.repo
      ? await enrichReviewRequest(match.repo, match.prNumber, { currentHeadSha: prInfo?.head_sha })
      : null;

    const [owner, repoName] = (match.repo ?? "").split("/");
    const merge_readiness =
      match.status === "approved" &&
      !prInfo?.merged &&
      typeof match.prNumber === "number" &&
      owner &&
      repoName
        ? await fetchMergeReadiness(owner, repoName, match.prNumber)
        : null;

    // Vercel preview URL (for permissionprotocol-site PRs)
    const preview_url = match.prNumber && match.repo
      ? await fetchVercelPreview(match.repo, match.prNumber)
      : null;

    return NextResponse.json({
      ...mapToReviewRequest(match, prInfo),
      enrichment,
      summary_sha: enrichment?.summary_sha ?? null,
      summary_generated_at: enrichment?.summary_generated_at ?? null,
      current_head_sha: prInfo?.head_sha ?? null,
      merge_readiness,
      preview_url,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to fetch request details.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
