import { NextResponse } from "next/server";
import { fetchDeployRequestsByStatuses, GH_API, ghHeaders } from "../../review/lib/shared";

type ReconcileCandidate = {
  id?: string;
  repo?: string;
  pr_number?: number | null;
};

type ReconcileRequest = {
  requests?: ReconcileCandidate[];
};

type ReconciledReview = {
  id: string;
  state: string;
  merged: boolean;
};

async function fetchPrState(repo: string, prNumber: number): Promise<{ state: string; merged: boolean } | null> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return null;

  try {
    const response = await fetch(`${GH_API}/repos/${repo}/pulls/${prNumber}`, {
      headers: ghHeaders(githubToken),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const body = (await response.json()) as { state?: string; merged?: boolean };
    return {
      state: body.state ?? "unknown",
      merged: body.merged ?? false,
    };
  } catch {
    return null;
  }
}

async function loadCandidates(request: Request): Promise<ReconcileCandidate[]> {
  const body = (await request.json().catch(() => ({}))) as ReconcileRequest;
  if (Array.isArray(body.requests) && body.requests.length > 0) {
    return body.requests;
  }

  const pendingRequests = await fetchDeployRequestsByStatuses(["pending"], 100);
  return pendingRequests.map((item) => ({
    id: typeof item.id === "string" ? item.id : undefined,
    repo: typeof item.repo === "string" ? item.repo : undefined,
    pr_number: typeof item.prNumber === "number" ? item.prNumber : null,
  }));
}

export async function POST(request: Request) {
  try {
    const candidates = await loadCandidates(request);
    const uniqueCandidates = candidates.filter((candidate, index, list) => {
      if (!candidate?.id || !candidate.repo || !candidate.pr_number) return false;
      return list.findIndex((item) => item.id === candidate.id) === index;
    });

    const stale = (
      await Promise.all(
        uniqueCandidates.map(async (candidate) => {
          const prState = await fetchPrState(candidate.repo!, candidate.pr_number!);
          if (!prState) return null;
          if (!prState.merged && prState.state !== "closed") return null;
          return {
            id: candidate.id!,
            state: prState.state,
            merged: prState.merged,
          } satisfies ReconciledReview;
        })
      )
    ).filter((item): item is ReconciledReview => item !== null);

    return NextResponse.json({
      stale,
      stale_ids: stale.map((item) => item.id),
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to reconcile review requests.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
