import { NextResponse } from "next/server";
import { getPPAuthHeaders } from "../auth";

const PP_BASE_URL = process.env.PP_API_URL || "https://app.permissionprotocol.com/api/v1";

const STATUSES = ["pending", "approved", "denied", "expired", "superseded", "cancelled"];

/**
 * Map PP API deploy-request fields to the frontend ReviewRequest shape.
 */
function mapToReviewRequest(raw: any) {
  return {
    id: raw.id,
    action: raw.capability || raw.action || "Unknown",
    resource: raw.repo || raw.resource || "Unknown",
    actor: raw.createdByRef || raw.actor || raw.requested_by || "Unknown",
    requested_by: raw.createdByRef || raw.requested_by,
    risk_tier: raw.env === "production" ? "high" : raw.env === "staging" ? "medium" : "low",
    scope: raw.env ? `${raw.env} — ${raw.ref || ""}`.trim() : raw.scope,
    timestamp: raw.createdAt || raw.created_at,
    created_at: raw.createdAt || raw.created_at,
    status: raw.status,
    approval_status: raw.approvalStatus,
    commit_sha: raw.commitSha,
    github_pr: raw.prNumber
      ? {
          owner: raw.repo?.split("/")[0],
          repo: raw.repo?.split("/")[1],
          pr_number: raw.prNumber,
          title: `PR #${raw.prNumber}`,
          description: raw.reason || null,
          files_changed: [],
        }
      : undefined,
    // Pass through raw fields for debugging
    _raw_env: raw.env,
    _raw_repo: raw.repo,
    _raw_capability: raw.capability,
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
        return NextResponse.json(mapToReviewRequest(match));
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
