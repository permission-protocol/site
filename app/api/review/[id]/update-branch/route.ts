import { NextResponse } from "next/server";
import { GH_API, ghHeaders, fetchRequestDetails } from "../../lib/shared";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const requestDetails = await fetchRequestDetails(params.id);
    if (!requestDetails) {
      return NextResponse.json({ success: false, message: "Request not found." }, { status: 404 });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return NextResponse.json({ success: false, message: "GitHub token not configured." }, { status: 503 });
    }

    const repo = requestDetails.repo as string | undefined;
    const prNumber = requestDetails.prNumber as number | undefined;
    const [owner, repoName] = (repo ?? "").split("/");

    if (!owner || !repoName || typeof prNumber !== "number") {
      return NextResponse.json({ success: false, message: "Request is not linked to a GitHub PR." }, { status: 400 });
    }

    const response = await fetch(`${GH_API}/repos/${owner}/${repoName}/pulls/${prNumber}/update-branch`, {
      method: "PUT",
      headers: ghHeaders(githubToken),
      body: JSON.stringify({ expected_head_sha: requestDetails.commitSha ?? undefined }),
    });

    const data = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message ?? "Unable to update branch." },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message ?? "Branch update started.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Unable to update branch." },
      { status: 500 }
    );
  }
}
