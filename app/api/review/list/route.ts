import { NextResponse } from "next/server";
import { getPPAuthHeaders } from "../auth";
import { PP_BASE_URL, GH_API, ghHeaders } from "../lib/shared";

type PrMeta = { title: string; author: string };

/**
 * Fetch PR title + author from GitHub (batched, best-effort).
 */
async function fetchPrMeta(repo: string, prNumber: number): Promise<PrMeta | null> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return null;
  try {
    const res = await fetch(`${GH_API}/repos/${repo}/pulls/${prNumber}`, {
      headers: ghHeaders(githubToken),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string; user?: { login?: string }; merged?: boolean; state?: string };
    return {
      title: data.title ?? `PR #${prNumber}`,
      author: data.user?.login ?? "unknown",
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const authHeaders = getPPAuthHeaders();
    const statuses = ["pending", "approved"];
    const allRequests: any[] = [];

    for (const status of statuses) {
      const response = await fetch(
        `${PP_BASE_URL}/deploy-requests?status=${status}&limit=50`,
        { method: "GET", headers: { Accept: "application/json", ...authHeaders }, cache: "no-store" }
      );
      if (!response.ok) continue;
      const data = await response.json().catch(() => null);
      if (!data) continue;

      const requests = data.requests || [];
      if (data.groups) {
        for (const group of data.groups) {
          if (group.latestPending) requests.push(group.latestPending);
          if (group.requests) requests.push(...group.requests);
          if (group.items) requests.push(...group.items);
        }
      }
      allRequests.push(...requests);
    }

    // Deduplicate by ID
    const seen = new Set<string>();
    const unique = allRequests.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    // Enrich with PR titles (parallel, best-effort)
    const enriched = await Promise.all(
      unique.map(async (r) => {
        const prMeta = r.prNumber && r.repo ? await fetchPrMeta(r.repo, r.prNumber) : null;
        return {
          id: r.id,
          status: r.status,
          repo: r.repo,
          env: r.env,
          pr_number: r.prNumber ?? null,
          pr_title: prMeta?.title ?? (r.prNumber ? `PR #${r.prNumber}` : null),
          actor: prMeta?.author ?? r.createdByRef ?? "CI",
          capability: r.capability,
          risk_tier: r.env === "production" ? "high" : r.env === "staging" ? "medium" : "low",
          created_at: r.createdAt,
        };
      })
    );

    // Sort: pending first, then by date desc
    enriched.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({ requests: enriched });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to fetch requests.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
