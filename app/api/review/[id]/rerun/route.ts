import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/src/lib/auth";
import { triggerGitHubRerun } from "../../lib/rerun";
import { fetchRequestDetails } from "../../lib/shared";

const RERUN_WINDOW_MS = 5 * 60 * 1000;
const RERUN_MAX_ATTEMPTS = 5;

const rerunAttempts = new Map<string, number[]>();

function getRecentAttempts(id: string, now: number) {
  const windowStart = now - RERUN_WINDOW_MS;
  const attempts = rerunAttempts.get(id)?.filter((timestamp) => timestamp > windowStart) ?? [];
  if (attempts.length > 0) {
    rerunAttempts.set(id, attempts);
  } else {
    rerunAttempts.delete(id);
  }
  return attempts;
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const username = session?.user?.name?.trim();
    if (!session || !username) {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
    }

    const requestDetails = await fetchRequestDetails(params.id);
    if (!requestDetails) {
      return NextResponse.json({ ok: false, error: "Request not found." }, { status: 404 });
    }
    if (requestDetails.status !== "approved") {
      return NextResponse.json({ ok: false, error: "Only approved requests can rerun Deploy Gate." }, { status: 409 });
    }

    const repo = requestDetails.repo as string | undefined;
    const prNumber = requestDetails.prNumber as number | undefined;
    const checkRunId = requestDetails.checkRunId as string | undefined;
    const runId = requestDetails.runId as string | undefined;

    const owner = repo?.split("/")[0];
    const repoName = repo?.split("/")[1];
    if (!owner || !repoName || typeof prNumber !== "number") {
      return NextResponse.json({ ok: false, error: "Request is missing GitHub PR context." }, { status: 400 });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return NextResponse.json({ ok: false, error: "GITHUB_TOKEN is not configured." }, { status: 500 });
    }

    const now = Date.now();
    const attempts = getRecentAttempts(params.id, now);
    if (attempts.length >= RERUN_MAX_ATTEMPTS) {
      return NextResponse.json({ ok: false, error: "Too many retries. Try again in a few minutes." }, { status: 429 });
    }
    rerunAttempts.set(params.id, [...attempts, now]);

    const result = await triggerGitHubRerun({
      owner,
      repo: repoName,
      prNumber,
      githubToken,
      checkRunId: checkRunId ?? null,
      runId: runId ?? null,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Unable to rerun Deploy Gate.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
