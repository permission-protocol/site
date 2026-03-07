import { NextResponse } from "next/server";
import { getPPAuthHeaders } from "../../auth";
import { PP_BASE_URL, GH_API, ghHeaders, fetchRequestDetails } from "../../lib/shared";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    const requestDetails = await fetchRequestDetails(params.id);

    const rejectResponse = await fetch(`${PP_BASE_URL}/deploy-requests/${params.id}/deny`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getPPAuthHeaders(),
      },
      body: JSON.stringify({
        rejected_by: "reviewer",
        reason: body.reason
      })
    });

    const rejectData = (await rejectResponse.json().catch(() => ({}))) as { error?: string };
    if (!rejectResponse.ok) {
      const errorMessage =
        rejectResponse.status === 409 ? "This request was already decided." : rejectData.error ?? "Rejection failed.";
      return NextResponse.json({ error: errorMessage, details: rejectData }, { status: rejectResponse.status || 500 });
    }

    // Post rejection comment on the PR (non-blocking)
    const repo = requestDetails?.repo as string | undefined;
    const prNumber = requestDetails?.prNumber as number | undefined;
    const owner = repo?.split("/")[0];
    const repoName = repo?.split("/")[1];
    if (owner && repoName && prNumber) {
      const githubToken = process.env.GITHUB_TOKEN;
      if (githubToken) {
        const reviewUrl = `https://www.permissionprotocol.com/review/${params.id}`;
        const reasonText = body.reason ? `\n\n**Reason:** ${body.reason}` : "";
        const commentBody = `❌ **Permission Protocol** — Rejected${reasonText}\n\n🔗 [View on Permission Protocol](${reviewUrl})`;
        await fetch(`${GH_API}/repos/${owner}/${repoName}/issues/${prNumber}/comments`, {
          method: "POST",
          headers: ghHeaders(githubToken),
          body: JSON.stringify({ body: commentBody }),
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      ...rejectData
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to reject request.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
