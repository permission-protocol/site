import { NextResponse } from "next/server";
import { getPPAuthHeaders } from "../../auth";

const PP_BASE_URL = process.env.PP_API_URL || "https://app.permissionprotocol.com/api/v1";

const STATUSES = ["pending", "approved", "denied", "expired", "superseded", "cancelled"];

/**
 * Fetch the deploy request to get PR metadata (prNumber, repo).
 * The approve API response doesn't include this.
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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json().catch(() => ({}))) as { reason?: string };

    // Fetch request details FIRST to get PR metadata
    const requestDetails = await fetchRequestDetails(params.id);

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
        productionConfirmed: true
      })
    });

    const approveData = (await approveResponse.json().catch(() => ({}))) as Record<string, unknown>;
    if (!approveResponse.ok) {
      const errorMessage =
        approveResponse.status === 409
          ? "This request was already approved or decided."
          : (approveData.error as string) ?? "Approval failed.";
      return NextResponse.json({ error: errorMessage, details: approveData }, { status: approveResponse.status || 500 });
    }

    // Extract PR info from the request details (not the approve response)
    const repo = requestDetails?.repo as string | undefined;
    const prNumber = requestDetails?.prNumber as number | undefined;
    const owner = repo?.split("/")[0];
    const repoName = repo?.split("/")[1];
    const hasPrContext = !!owner && !!repoName && typeof prNumber === "number";

    let mergeResult: { merged: boolean; message?: string; details?: unknown } | null = null;
    if (hasPrContext) {
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        mergeResult = { merged: false, message: "GITHUB_TOKEN is not configured. Skipped PR merge." };
      } else {
        const mergeResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/merge`,
          {
            method: "PUT",
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${githubToken}`,
              "X-GitHub-Api-Version": "2022-11-28",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              merge_method: "squash"
            })
          }
        );

        const mergeData = (await mergeResponse.json().catch(() => ({}))) as { message?: string; merged?: boolean };
        if (!mergeResponse.ok) {
          mergeResult = {
            merged: false,
            message: mergeData.message ?? "PR merge failed after approval.",
            details: mergeData
          };
        } else {
          mergeResult = {
            merged: mergeData.merged === true,
            message: mergeData.message ?? "PR merged."
          };
        }
      }
    }

    const receiptId = (approveData.receipt_id ?? (approveData.receipt as any)?.id ?? (approveData.result as any)?.receiptId) as string | null;
    return NextResponse.json({
      ...approveData,
      receipt_id: receiptId,
      merge: mergeResult,
      github_pr: hasPrContext ? { owner, repo: repoName, pr_number: prNumber } : null
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to approve request.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
