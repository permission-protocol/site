import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/src/lib/auth";
import { getPPAuthHeaders } from "../../auth";
import { PP_BASE_URL, GH_API, ghHeaders, fetchRequestDetails } from "../../lib/shared";

// ---------------------------------------------------------------------------
// GitHub Action Rerun — Hybrid strategy (mirrors PP app's github-rerun.ts)
// ---------------------------------------------------------------------------

const RERUN_RETRY_DELAYS = [1500, 3000]; // ms between retries
const DEPLOY_GATE_CHECK_NAME = "Deploy Gate / Permission Protocol";

type RerunResult = { ok: boolean; strategy?: string; error?: string };

async function tryRerun(url: string, token: string, strategy: string): Promise<RerunResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (res.ok || res.status === 201) {
      return { ok: true, strategy };
    }
    return { ok: false, strategy, error: `${strategy} returned ${res.status}` };
  } catch (err) {
    return { ok: false, strategy, error: (err as Error).message };
  }
}

async function findDeployGateCheckRun(params: {
  owner: string;
  repo: string;
  sha: string;
  githubToken: string;
}): Promise<{ checkRunId: string; runId: string | null } | null> {
  try {
    const res = await fetch(
      `${GH_API}/repos/${params.owner}/${params.repo}/commits/${params.sha}/check-runs?per_page=100`,
      { headers: ghHeaders(params.githubToken) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      check_runs?: Array<{
        id?: number;
        name?: string;
        conclusion?: string;
        details_url?: string;
      }>;
    };
    const deployGateRun = data.check_runs?.find(
      (cr) =>
        cr.name?.includes("Deploy Gate") ||
        cr.name?.includes("Permission Protocol") ||
        cr.name === DEPLOY_GATE_CHECK_NAME
    );
    if (!deployGateRun?.id) return null;

    // Extract workflow run ID from the details URL if available
    const runIdMatch = deployGateRun.details_url?.match(/\/actions\/runs\/(\d+)/);
    return {
      checkRunId: String(deployGateRun.id),
      runId: runIdMatch?.[1] ?? null,
    };
  } catch {
    return null;
  }
}

async function triggerGitHubRerun(params: {
  owner: string;
  repo: string;
  prNumber: number;
  githubToken: string;
  checkRunId: string | null;
  runId: string | null;
}): Promise<RerunResult> {
  let { checkRunId, runId } = params;

  // If we don't have IDs from the deploy request, look them up from the PR
  if (!checkRunId && !runId) {
    const prRes = await fetch(
      `${GH_API}/repos/${params.owner}/${params.repo}/pulls/${params.prNumber}`,
      { headers: ghHeaders(params.githubToken) }
    );
    const prData = (await prRes.json().catch(() => ({}))) as { head?: { sha?: string } };
    const sha = prData.head?.sha;
    if (sha) {
      const found = await findDeployGateCheckRun({
        owner: params.owner,
        repo: params.repo,
        sha,
        githubToken: params.githubToken,
      });
      if (found) {
        checkRunId = found.checkRunId;
        runId = found.runId;
      }
    }
  }

  // Strategy 1: Check run rerequest (preferred — lighter, doesn't re-run entire workflow)
  if (checkRunId) {
    for (let attempt = 0; attempt <= RERUN_RETRY_DELAYS.length; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, RERUN_RETRY_DELAYS[attempt - 1]));
      }
      const result = await tryRerun(
        `${GH_API}/repos/${params.owner}/${params.repo}/check-runs/${checkRunId}/rerequest`,
        params.githubToken,
        "check_run"
      );
      if (result.ok) return result;
      // If 404, the check run may not exist — fall through to workflow rerun
      if (result.error?.includes("404")) break;
      // If not retryable, stop
      if (!result.error?.includes("429") && !result.error?.includes("50")) break;
    }
  }

  // Strategy 2: Workflow run rerun (reruns entire workflow)
  if (runId) {
    for (let attempt = 0; attempt <= RERUN_RETRY_DELAYS.length; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, RERUN_RETRY_DELAYS[attempt - 1]));
      }
      const result = await tryRerun(
        `${GH_API}/repos/${params.owner}/${params.repo}/actions/runs/${runId}/rerun`,
        params.githubToken,
        "actions_run"
      );
      if (result.ok) return result;
      if (!result.error?.includes("429") && !result.error?.includes("50")) break;
    }
  }

  // Neither strategy worked
  if (!checkRunId && !runId) {
    return { ok: false, error: "No check run or workflow run ID available for rerun" };
  }
  return { ok: false, error: "All rerun strategies exhausted" };
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const username = session?.user?.name?.trim();
    if (!session || !username) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

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
        approved_by: username,
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

    // Step 3: Re-run the Deploy Gate GitHub Action
    // The action initially failed with "pending approval". Now that we've approved
    // and set the commit status, re-run it so the check goes green.
    // Hybrid strategy: try check_run rerequest first, fall back to actions/runs rerun.
    let rerunResult: { ok: boolean; strategy?: string; error?: string } | null = null;
    if (hasPrContext) {
      const githubToken = process.env.GITHUB_TOKEN;
      if (githubToken && statusResult?.ok) {
        const checkRunId = requestDetails?.checkRunId as string | undefined;
        const runId = requestDetails?.runId as string | undefined;

        rerunResult = await triggerGitHubRerun({
          owner: owner!,
          repo: repoName!,
          prNumber: prNumber!,
          githubToken,
          checkRunId: checkRunId ?? null,
          runId: runId ?? null,
        });
      }
    }

    // Step 4: Post approval comment on the PR (non-blocking)
    if (hasPrContext) {
      const githubToken = process.env.GITHUB_TOKEN;
      if (githubToken) {
        const reviewUrl = `https://www.permissionprotocol.com/review/${params.id}`;
        const reasonText = body.reason ? `\n\n**Reason:** ${body.reason}` : "";
        const commentBody = `✅ **Permission Protocol** — Approved by @${username}${reasonText}\n\nReceipt: \`${receiptId?.slice(0, 24) ?? "—"}\`\n🔗 [View on Permission Protocol](${reviewUrl})`;
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
      rerun_result: rerunResult,
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
