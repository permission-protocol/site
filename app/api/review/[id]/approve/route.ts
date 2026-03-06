import { NextResponse } from "next/server";
import { getPPAuthHeaders } from "../../auth";

const PP_BASE_URL = process.env.PP_API_URL || "https://app.permissionprotocol.com/api/v1";

type GithubPrMetadata = {
  owner?: string;
  repo?: string;
  pr_number?: number;
};

type ApprovalResponse = {
  receipt_id?: string;
  receipt?: { id?: string };
  github_pr?: GithubPrMetadata;
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json().catch(() => ({}))) as { reason?: string };

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

    const approveData = (await approveResponse.json().catch(() => ({}))) as ApprovalResponse & { error?: string };
    if (!approveResponse.ok) {
      const errorMessage =
        approveResponse.status === 409 ? "This request was already approved or decided." : approveData.error ?? "Approval failed.";
      return NextResponse.json({ error: errorMessage, details: approveData }, { status: approveResponse.status || 500 });
    }

    const githubPr = approveData.github_pr;
    const hasPrContext = !!githubPr?.owner && !!githubPr?.repo && typeof githubPr.pr_number === "number";

    let mergeResult: { merged: boolean; message?: string; details?: unknown } | null = null;
    if (hasPrContext) {
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        mergeResult = { merged: false, message: "GITHUB_TOKEN is not configured. Skipped PR merge." };
      } else {
        const mergeResponse = await fetch(
          `https://api.github.com/repos/${githubPr.owner}/${githubPr.repo}/pulls/${githubPr.pr_number}/merge`,
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

    const receiptId = approveData.receipt_id ?? approveData.receipt?.id ?? null;
    return NextResponse.json({
      ...approveData,
      receipt_id: receiptId,
      merge: mergeResult
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to approve request.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
