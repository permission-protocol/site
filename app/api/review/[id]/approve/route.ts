import { NextResponse } from "next/server";
import { getPPAuthHeaders } from "../../auth";

const PP_BASE_URL = process.env.PP_API_URL || "https://app.permissionprotocol.com/api/v1";
const GH_API = "https://api.github.com";
const STATUSES = ["pending", "approved", "denied", "expired", "superseded", "cancelled"];

function ghHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

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

    // Step 2: Set commit status on GitHub (approve only — no merge)
    const repo = requestDetails?.repo as string | undefined;
    const prNumber = requestDetails?.prNumber as number | undefined;
    const commitSha = requestDetails?.commitSha as string | undefined;
    const owner = repo?.split("/")[0];
    const repoName = repo?.split("/")[1];
    const hasPrContext = !!owner && !!repoName && typeof prNumber === "number";

    let statusResult: { ok: boolean; error?: string } | null = null;
    if (hasPrContext && commitSha) {
      const githubToken = process.env.GITHUB_TOKEN;
      if (githubToken) {
        const targetUrl = `https://www.permissionprotocol.com/review/${params.id}`;
        const res = await fetch(`${GH_API}/repos/${owner}/${repoName}/statuses/${commitSha}`, {
          method: "POST",
          headers: ghHeaders(githubToken),
          body: JSON.stringify({
            state: "success",
            context: "Permission Protocol",
            description: receiptId ? `Approved — receipt ${receiptId.slice(0, 20)}` : "Approved by reviewer",
            target_url: targetUrl,
          }),
        });
        statusResult = res.ok
          ? { ok: true }
          : { ok: false, error: ((await res.json().catch(() => ({}))) as any).message ?? `${res.status}` };
      }
    }

    return NextResponse.json({
      ...approveData,
      receipt_id: receiptId,
      commit_status: statusResult,
      has_pr: hasPrContext,
      github_pr: hasPrContext ? { owner, repo: repoName, pr_number: prNumber } : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to approve request.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
