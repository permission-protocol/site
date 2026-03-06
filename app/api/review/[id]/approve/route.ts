import { NextResponse } from "next/server";
import { getPPAuthHeaders } from "../../auth";

const PP_BASE_URL = process.env.PP_API_URL || "https://app.permissionprotocol.com/api/v1";
const STATUSES = ["pending", "approved", "denied", "expired", "superseded", "cancelled"];
const GH_API = "https://api.github.com";
const GH_GQL = "https://api.github.com/graphql";

/**
 * Fetch the deploy request to get PR metadata (prNumber, repo, commitSha).
 */
async function fetchRequestDetails(id: string) {
  const authHeaders = getPPAuthHeaders();
  for (const status of STATUSES) {
    const response = await fetch(
      `${PP_BASE_URL}/deploy-requests?status=${status}&limit=100`,
      { method: "GET", headers: { Accept: "application/json", ...authHeaders }, cache: "no-store" }
    );
    if (!response.ok) continue;
    const data = await response.json().catch(() => null);
    if (!data?.groups) continue;
    for (const group of data.groups) {
      if (group.latestPending?.id === id) return group.latestPending;
      for (const item of group.history || []) {
        if (item.id === id) return item;
      }
    }
  }
  return null;
}

function ghHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

/**
 * Set a commit status on the PR head SHA: "Permission Protocol: Approved"
 */
async function setCommitStatus(
  token: string,
  owner: string,
  repo: string,
  sha: string,
  receiptId: string | null,
  requestId: string
): Promise<{ ok: boolean; error?: string }> {
  const targetUrl = `https://www.permissionprotocol.com/review/${requestId}`;
  const res = await fetch(`${GH_API}/repos/${owner}/${repo}/statuses/${sha}`, {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify({
      state: "success",
      context: "Permission Protocol",
      description: receiptId
        ? `Approved — receipt ${receiptId.slice(0, 20)}`
        : "Approved by reviewer",
      target_url: targetUrl,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: (data as any).message ?? `Status API returned ${res.status}` };
  }
  return { ok: true };
}

/**
 * Try direct squash merge via REST API.
 */
async function tryDirectMerge(
  token: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<{ merged: boolean; blocked: boolean; message?: string; details?: unknown }> {
  const res = await fetch(`${GH_API}/repos/${owner}/${repo}/pulls/${prNumber}/merge`, {
    method: "PUT",
    headers: ghHeaders(token),
    body: JSON.stringify({ merge_method: "squash" }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (res.ok) {
    return { merged: data.merged === true, blocked: false, message: (data.message as string) ?? "PR merged." };
  }

  // 405 = merge not allowed (branch protection / checks failing)
  // 422 = validation failed (branch not mergeable)
  const blocked = res.status === 405 || res.status === 422;
  return {
    merged: false,
    blocked,
    message: (data.message as string) ?? `Merge failed (${res.status})`,
    details: data,
  };
}

/**
 * Enable auto-merge on a PR via GitHub GraphQL API.
 * GitHub will merge automatically once all required checks pass.
 */
async function enableAutoMerge(
  token: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<{ enabled: boolean; message?: string }> {
  // First get the PR node ID
  const prRes = await fetch(`${GH_API}/repos/${owner}/${repo}/pulls/${prNumber}`, {
    headers: ghHeaders(token),
  });
  if (!prRes.ok) {
    return { enabled: false, message: `Could not fetch PR: ${prRes.status}` };
  }
  const prData = (await prRes.json()) as { node_id?: string };
  const nodeId = prData.node_id;
  if (!nodeId) {
    return { enabled: false, message: "PR node_id not found" };
  }

  // Enable auto-merge via GraphQL
  const mutation = `
    mutation EnableAutoMerge($pullRequestId: ID!, $mergeMethod: PullRequestMergeMethod!) {
      enablePullRequestAutoMerge(input: { pullRequestId: $pullRequestId, mergeMethod: $mergeMethod }) {
        pullRequest { autoMergeRequest { enabledAt mergeMethod } }
      }
    }
  `;

  const gqlRes = await fetch(GH_GQL, {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify({
      query: mutation,
      variables: { pullRequestId: nodeId, mergeMethod: "SQUASH" },
    }),
  });

  const gqlData = (await gqlRes.json()) as { data?: any; errors?: Array<{ message: string }> };
  if (gqlData.errors?.length) {
    const errMsg = gqlData.errors[0].message;
    // "Pull request Auto merge is not allowed for this repository" = auto-merge not enabled in repo settings
    return { enabled: false, message: errMsg };
  }

  return { enabled: true, message: "Auto-merge enabled. PR will merge when all checks pass." };
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json().catch(() => ({}))) as { reason?: string };

    // Fetch request details FIRST to get PR metadata
    const requestDetails = await fetchRequestDetails(params.id);

    // Step 1: Approve on PP
    const approveResponse = await fetch(`${PP_BASE_URL}/deploy-requests/${params.id}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getPPAuthHeaders(),
      },
      body: JSON.stringify({
        approved_by: "reviewer",
        reason: body.reason,
        productionConfirmed: true,
      }),
    });

    const approveData = (await approveResponse.json().catch(() => ({}))) as Record<string, unknown>;
    if (!approveResponse.ok) {
      const errorMessage =
        approveResponse.status === 409
          ? "This request was already approved or decided."
          : (approveData.error as string) ?? "Approval failed.";
      return NextResponse.json({ error: errorMessage, details: approveData }, { status: approveResponse.status || 500 });
    }

    const receiptId = (
      approveData.receipt_id ??
      (approveData.receipt as any)?.id ??
      (approveData.result as any)?.receiptId
    ) as string | null;

    // Extract PR info
    const repo = requestDetails?.repo as string | undefined;
    const prNumber = requestDetails?.prNumber as number | undefined;
    const commitSha = requestDetails?.commitSha as string | undefined;
    const owner = repo?.split("/")[0];
    const repoName = repo?.split("/")[1];
    const hasPrContext = !!owner && !!repoName && typeof prNumber === "number";

    let statusResult: { ok: boolean; error?: string } | null = null;
    let mergeResult: { merged: boolean; blocked?: boolean; message?: string; details?: unknown } | null = null;
    let autoMergeResult: { enabled: boolean; message?: string } | null = null;

    if (hasPrContext) {
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        mergeResult = { merged: false, message: "GITHUB_TOKEN is not configured." };
      } else {
        // Step 2: Set commit status "Permission Protocol: Approved"
        if (commitSha) {
          statusResult = await setCommitStatus(githubToken, owner, repoName, commitSha, receiptId, params.id);
        }

        // Step 3: Try direct merge
        mergeResult = await tryDirectMerge(githubToken, owner, repoName, prNumber);

        // Step 4: If merge blocked by branch protection, enable auto-merge
        if (!mergeResult.merged && mergeResult.blocked) {
          autoMergeResult = await enableAutoMerge(githubToken, owner, repoName, prNumber);
        }
      }
    }

    return NextResponse.json({
      ...approveData,
      receipt_id: receiptId,
      commit_status: statusResult,
      merge: mergeResult,
      auto_merge: autoMergeResult,
      github_pr: hasPrContext ? { owner, repo: repoName, pr_number: prNumber } : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to approve request.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
