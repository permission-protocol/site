import { NextResponse } from "next/server";
import { getPPAuthHeaders } from "../auth";
import { enrichReviewRequest } from "../lib/enrich";

const PP_BASE_URL = process.env.PP_API_URL || "https://app.permissionprotocol.com/api/v1";
const GH_API = "https://api.github.com";

const STATUSES = ["pending", "approved", "denied", "expired", "superseded", "cancelled"];

function ghHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

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
    const authHeaders = getPPAuthHeaders();

    for (const status of STATUSES) {
      const response = await fetch(
        `${PP_BASE_URL}/deploy-requests?status=${status}&limit=100`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...authHeaders,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) continue;

      const data = await response.json().catch(() => null);
      if (!data) continue;

      const requests = data.requests || [];
      if (data.groups) {
        for (const group of data.groups) {
          if (group.latestPending) requests.push(group.latestPending);
          if (group.requests) requests.push(...group.requests);
          if (group.items) requests.push(...group.items);
          if (group.history) requests.push(...group.history);
        }
      }

      const match = requests.find((r: any) => r.id === params.id);
      if (match) {
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
      }
    }

    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to fetch request details.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
