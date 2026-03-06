import { NextResponse } from "next/server";
import { GH_API, GH_GQL, ghHeaders, fetchRequestDetails } from "../../lib/shared";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return NextResponse.json({ error: "GITHUB_TOKEN not configured." }, { status: 500 });
    }

    // Verify the request is approved before allowing merge
    const requestDetails = await fetchRequestDetails(params.id);
    if (!requestDetails) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    if (requestDetails.status !== "approved") {
      return NextResponse.json(
        { error: `Cannot merge — request is "${requestDetails.status}". Must be approved first.` },
        { status: 400 }
      );
    }

    const repo = requestDetails.repo as string | undefined;
    const prNumber = requestDetails.prNumber as number | undefined;
    const owner = repo?.split("/")[0];
    const repoName = repo?.split("/")[1];

    if (!owner || !repoName || typeof prNumber !== "number") {
      return NextResponse.json({ error: "No PR associated with this request." }, { status: 400 });
    }

    // Try direct squash merge
    const mergeRes = await fetch(`${GH_API}/repos/${owner}/${repoName}/pulls/${prNumber}/merge`, {
      method: "PUT",
      headers: ghHeaders(githubToken),
      body: JSON.stringify({ merge_method: "squash" }),
    });
    const mergeData = (await mergeRes.json().catch(() => ({}))) as Record<string, unknown>;

    if (mergeRes.ok) {
      return NextResponse.json({
        merged: true,
        message: (mergeData.message as string) ?? "PR merged successfully.",
        auto_merge: null,
      });
    }

    // If blocked by branch protection, try enabling auto-merge
    if (mergeRes.status === 405 || mergeRes.status === 422) {
      const prRes = await fetch(`${GH_API}/repos/${owner}/${repoName}/pulls/${prNumber}`, {
        headers: ghHeaders(githubToken),
      });
      const prData = (await prRes.json()) as { node_id?: string };

      if (prData.node_id) {
        const mutation = `
          mutation EnableAutoMerge($pullRequestId: ID!, $mergeMethod: PullRequestMergeMethod!) {
            enablePullRequestAutoMerge(input: { pullRequestId: $pullRequestId, mergeMethod: $mergeMethod }) {
              pullRequest { autoMergeRequest { enabledAt mergeMethod } }
            }
          }
        `;
        const gqlRes = await fetch(GH_GQL, {
          method: "POST",
          headers: ghHeaders(githubToken),
          body: JSON.stringify({
            query: mutation,
            variables: { pullRequestId: prData.node_id, mergeMethod: "SQUASH" },
          }),
        });
        const gqlData = (await gqlRes.json()) as { data?: any; errors?: Array<{ message: string }> };

        if (!gqlData.errors?.length) {
          return NextResponse.json({
            merged: false,
            message: "Auto-merge enabled. PR will merge when all checks pass.",
            auto_merge: { enabled: true },
          });
        }

        return NextResponse.json({
          merged: false,
          message: (mergeData.message as string) ?? "Merge blocked by branch protection.",
          auto_merge: { enabled: false, error: gqlData.errors?.[0]?.message },
        });
      }
    }

    return NextResponse.json({
      merged: false,
      message: (mergeData.message as string) ?? `Merge failed (${mergeRes.status}).`,
      auto_merge: null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to merge.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
