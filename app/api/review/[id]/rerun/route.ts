import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/src/lib/auth";
import {
  manualRerunLimit,
  manualRerunWindowMs,
  takeManualRerunAttempt,
  triggerGitHubRerun,
} from "../../lib/github-rerun";
import { fetchRequestDetails } from "../../lib/shared";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
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
      return NextResponse.json(
        { error: "Request must be approved before retrying Deploy Gate." },
        { status: 409 }
      );
    }

    const repo = requestDetails.repo as string | undefined;
    const prNumber = requestDetails.prNumber as number | undefined;
    const owner = repo?.split("/")[0];
    const repoName = repo?.split("/")[1];
    if (!owner || !repoName || typeof prNumber !== "number") {
      return NextResponse.json(
        { error: "This request does not have GitHub PR context for a Deploy Gate rerun." },
        { status: 400 }
      );
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return NextResponse.json({ error: "GitHub rerun is not configured on this site." }, { status: 503 });
    }

    const attempt = takeManualRerunAttempt(params.id);
    if (!attempt.allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil(attempt.retryAfterMs / 1000));
      return NextResponse.json(
        {
          error: `Retry limit reached. Max ${manualRerunLimit} attempts per ${Math.floor(manualRerunWindowMs / 60000)} minutes.`,
          attempts_remaining: 0,
          retry_after_seconds: retryAfterSeconds,
        },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }

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
      attempts_remaining: attempt.attemptsRemaining,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to rerun Deploy Gate.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
