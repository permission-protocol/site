import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/src/lib/auth";
import { getRerunRateLimit, recordRerunAttempt, triggerGitHubRerun } from "../../lib/rerun";
import { fetchRequestDetails } from "../../lib/shared";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const username = session?.user?.name?.trim();
    if (!session || !username) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const requestDetails = await fetchRequestDetails(params.id);
    if (!requestDetails) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    if (requestDetails.status !== "approved") {
      return NextResponse.json({ error: "Only approved requests can rerun the deploy gate." }, { status: 409 });
    }

    const repo = requestDetails.repo as string | undefined;
    const prNumber = requestDetails.prNumber as number | undefined;
    const [owner, repoName] = (repo ?? "").split("/");

    if (!owner || !repoName || typeof prNumber !== "number") {
      return NextResponse.json({ error: "This request does not have enough GitHub context to rerun." }, { status: 400 });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return NextResponse.json({ error: "GITHUB_TOKEN is not configured." }, { status: 500 });
    }

    const currentLimit = getRerunRateLimit(params.id);
    if (currentLimit.limited) {
      return NextResponse.json(
        {
          error: "Too many retries",
          rerun_result: { ok: false, error: "Too many retries" },
          rate_limit: currentLimit,
        },
        { status: 429 }
      );
    }

    const nextLimit = recordRerunAttempt(params.id);
    const rerunResult = await triggerGitHubRerun({
      owner,
      repo: repoName,
      prNumber,
      githubToken,
      checkRunId: (requestDetails.checkRunId as string | undefined) ?? null,
      runId: (requestDetails.runId as string | undefined) ?? null,
    });

    return NextResponse.json({
      rerun_result: rerunResult,
      rate_limit: nextLimit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to rerun deploy gate.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
