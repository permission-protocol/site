import { NextResponse } from "next/server";
import { clearEnrichmentCache, enrichReviewRequest } from "../../lib/enrich";
import { GH_API, ghHeaders, fetchRequestDetails } from "../../lib/shared";

async function fetchCurrentHeadSha(repo: string, prNumber: number): Promise<string | null> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return null;

  try {
    const response = await fetch(`${GH_API}/repos/${repo}/pulls/${prNumber}`, {
      headers: ghHeaders(githubToken),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { head?: { sha?: string } };
    return data.head?.sha ?? null;
  } catch {
    return null;
  }
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const match = await fetchRequestDetails(params.id);
    if (!match || !match.repo || typeof match.prNumber !== "number") {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    const currentHeadSha = await fetchCurrentHeadSha(match.repo, match.prNumber);
    clearEnrichmentCache(match.repo, match.prNumber, currentHeadSha);

    const enrichment = await enrichReviewRequest(match.repo, match.prNumber, {
      force: true,
      currentHeadSha,
    });

    return NextResponse.json(enrichment);
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to regenerate summary.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
