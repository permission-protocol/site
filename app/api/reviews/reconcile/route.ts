import { NextResponse } from "next/server";
import { fetchDeployRequestsByStatuses, GH_API, ghHeaders } from "../../review/lib/shared";

type ReconciledItem = {
  id: string;
  state: "closed" | "merged";
  repo: string;
  pr_number: number;
};

async function fetchPrState(repo: string, prNumber: number) {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return null;

  try {
    const response = await fetch(`${GH_API}/repos/${repo}/pulls/${prNumber}`, {
      headers: ghHeaders(githubToken),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const body = (await response.json()) as { state?: string; merged?: boolean };
    if (body.merged) return "merged" as const;
    if (body.state === "closed") return "closed" as const;
    return null;
  } catch {
    return null;
  }
}

export async function POST() {
  try {
    const pendingRequests = await fetchDeployRequestsByStatuses(["pending"], 100);
    const reconciled = (
      await Promise.all(
        pendingRequests.map(async (request) => {
          const repo = typeof request.repo === "string" ? request.repo : null;
          const prNumber = typeof request.prNumber === "number" ? request.prNumber : null;
          const id = typeof request.id === "string" ? request.id : null;

          if (!repo || !prNumber || !id) return null;

          const state = await fetchPrState(repo, prNumber);
          if (!state) return null;

          return {
            id,
            state,
            repo,
            pr_number: prNumber,
          } satisfies ReconciledItem;
        })
      )
    ).filter((item): item is ReconciledItem => item !== null);

    return NextResponse.json({
      stale_ids: reconciled.map((item) => item.id),
      requests: reconciled,
      reconciled_at: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to reconcile pending requests.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
