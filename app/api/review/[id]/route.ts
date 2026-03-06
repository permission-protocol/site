import { NextResponse } from "next/server";
import { enrichReviewRequest } from "../lib/enrich";
import { GH_API, ghHeaders, fetchRequestDetails } from "../lib/shared";

/**
 * Fetch PR author from GitHub as the actor (PP API doesn't store this).
 */
async function fetchPrAuthor(repo: string, prNumber: number): Promise<string | null> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return null;
  try {
    const res = await fetch(`${GH_API}/repos/${repo}/pulls/${prNumber}`, {
      headers: ghHeaders(githubToken),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: { login?: string } };
    return data.user?.login ?? null;
  } catch {
    return null;
  }
}

/**
 * Map PP API deploy-request fields to the frontend ReviewRequest shape.
 */
function mapToReviewRequest(raw: any, prAuthor?: string | null) {
  const owner = raw.repo?.split("/")[0];
  const repoName = raw.repo?.split("/")[1];
  return {
    id: raw.id,
    action: raw.capability || raw.action || "Unknown",
    resource: raw.repo || raw.resource || "Unknown",
    actor: prAuthor || raw.createdByRef || raw.actor || raw.requested_by || "CI",
    requested_by: prAuthor || raw.createdByRef || raw.requested_by,
    risk_tier: raw.env === "production" ? "high" : raw.env === "staging" ? "medium" : "low",
    scope: raw.env ? `${raw.env} — ${raw.ref || ""}`.trim() : raw.scope,
    timestamp: raw.createdAt || raw.created_at,
    created_at: raw.createdAt || raw.created_at,
    status: raw.status,
    approval_status: raw.approvalStatus,
    commit_sha: raw.commitSha,
    github_pr: raw.prNumber
      ? {
          owner,
          repo: repoName,
          pr_number: raw.prNumber,
          title: `PR #${raw.prNumber}`,
          description: raw.reason || null,
          files_changed: [],
        }
      : undefined,
  };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const match = await fetchRequestDetails(params.id);
    if (!match) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    // Fetch PR author from GitHub for the actor field
    const prAuthor = match.prNumber && match.repo
      ? await fetchPrAuthor(match.repo, match.prNumber)
      : null;

    // Phase 2: Enrich with diff, risk signals, and AI summary
    const enrichment = match.prNumber && match.repo
      ? await enrichReviewRequest(match.repo, match.prNumber)
      : null;

    return NextResponse.json({
      ...mapToReviewRequest(match, prAuthor),
      enrichment,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to fetch request details.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
