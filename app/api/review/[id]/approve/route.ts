import { NextResponse } from "next/server";
import { getPPAuthHeaders } from "../../auth";
import { PP_BASE_URL, GH_API, ghHeaders, fetchRequestDetails } from "../../lib/shared";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeaders = await getPPAuthHeaders();
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    const requestDetails = await fetchRequestDetails(params.id);

    // Step 1: Approve on PP
    const approveResponse = await fetch(`${PP_BASE_URL}/deploy-requests/${params.id}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        approved_by: "reviewer",
        reason: body.reason,
        productionConfirmed: true,
        // Required when verification failed (no prior receipt)
        riskAcceptanceCategory: "OTHER",
        riskAcceptanceReason: body.reason || "Approved via PP review surface",
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
    const owner = repo?.split("/")[0];
    const repoName = repo?.split("/")[1];
    const hasPrContext = !!owner && !!repoName && typeof prNumber === "number";

    let statusResult: { ok: boolean; error?: string } | null = null;
    if (hasPrContext) {
      const githubToken = process.env.GITHUB_TOKEN;
      if (githubToken) {
        // Fetch the PR's CURRENT head SHA from GitHub (not the deploy request's
        // commitSha which may be stale if the branch was updated)
        const prRes = await fetch(`${GH_API}/repos/${owner}/${repoName}/pulls/${prNumber}`, {
          headers: ghHeaders(githubToken),
        });
        const prData = (await prRes.json().catch(() => ({}))) as { head?: { sha?: string } };
        const currentSha = prData.head?.sha;

        if (currentSha) {
          const targetUrl = `https://www.permissionprotocol.com/review/${params.id}`;
          const res = await fetch(`${GH_API}/repos/${owner}/${repoName}/statuses/${currentSha}`, {
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
        } else {
          statusResult = { ok: false, error: "Could not fetch current PR head SHA" };
        }
      }
    }

    // Step 3: Post approval comment on the PR (non-blocking)
    if (hasPrContext) {
      const githubToken = process.env.GITHUB_TOKEN;
      if (githubToken) {
        const reviewUrl = `https://www.permissionprotocol.com/review/${params.id}`;
        const reasonText = body.reason ? `\n\n**Reason:** ${body.reason}` : "";
        const commentBody = `✅ **Permission Protocol** — Approved${reasonText}\n\nReceipt: \`${receiptId?.slice(0, 24) ?? "—"}\`\n🔗 [View on Permission Protocol](${reviewUrl})`;
        await fetch(`${GH_API}/repos/${owner}/${repoName}/issues/${prNumber}/comments`, {
          method: "POST",
          headers: ghHeaders(githubToken!),
          body: JSON.stringify({ body: commentBody }),
        }).catch(() => {});
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
