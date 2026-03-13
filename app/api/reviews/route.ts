import { NextResponse } from "next/server";
import { getPPAuthHeaders } from "../review/auth";
import { PP_BASE_URL, GH_API, ghHeaders } from "../review/lib/shared";

type PrMeta = { title: string; author: string };
type CreateReviewBody = {
  repo?: string;
  prNumber?: number;
  commitSha?: string;
  description?: string;
};

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

function buildRequestSummary(raw: any, prMeta?: PrMeta | null) {
  return {
    id: raw.id,
    status: raw.status,
    repo: raw.repo,
    env: raw.env,
    pr_number: raw.prNumber ?? null,
    pr_title: prMeta?.title ?? (raw.prNumber ? `PR #${raw.prNumber}` : null),
    actor: prMeta?.author ?? raw.createdByRef ?? "CI",
    capability: raw.capability ?? raw.action ?? "deploy",
    risk_tier: raw.env === "production" ? "high" : raw.env === "staging" ? "medium" : "low",
    created_at: raw.createdAt,
  };
}

export async function GET() {
  try {
    const authHeaders = await getPPAuthHeaders();
    const statuses = ["pending", "approved", "denied"];
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
        return buildRequestSummary(r, prMeta);
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

export async function POST(request: Request) {
  try {
    const authHeaders = await getPPAuthHeaders();
    const body = (await request.json().catch(() => ({}))) as CreateReviewBody;
    const repo = body.repo?.trim();
    const prNumber = Number(body.prNumber);
    const commitSha = body.commitSha?.trim();
    const description = body.description?.trim();

    if (!repo || !/^[^/\s]+\/[^/\s]+$/.test(repo)) {
      return NextResponse.json({ error: "Repo must be in owner/repo format." }, { status: 400 });
    }
    if (!Number.isInteger(prNumber) || prNumber <= 0) {
      return NextResponse.json({ error: "PR number must be a positive integer." }, { status: 400 });
    }
    if (!commitSha || !/^[a-f0-9]{7,40}$/i.test(commitSha)) {
      return NextResponse.json({ error: "Commit SHA must be 7-40 hex characters." }, { status: 400 });
    }

    const payload = {
      repo,
      prNumber,
      commitSha,
      reason: description || undefined,
      description: description || undefined,
      action: "deploy",
      capability: "deploy",
      env: "production",
      ref: `refs/pull/${prNumber}/head`,
      createdByRef: "manual-ui",
      metadata: {
        source: "manual-ui",
      },
    };

    const createResponse = await fetch(`${PP_BASE_URL}/deploy-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    const createData = (await createResponse.json().catch(() => ({}))) as Record<string, any>;
    if (!createResponse.ok) {
      return NextResponse.json(
        {
          error: (createData.error as string) ?? "Unable to create deploy request.",
          details: createData,
        },
        { status: createResponse.status || 500 }
      );
    }

    const created =
      createData.request ??
      createData.deployRequest ??
      createData.result ??
      createData;

    const normalized = {
      ...created,
      repo: created.repo ?? repo,
      prNumber: created.prNumber ?? prNumber,
      commitSha: created.commitSha ?? commitSha,
      createdByRef: created.createdByRef ?? "manual-ui",
      env: created.env ?? "production",
      status: created.status ?? "pending",
      createdAt: created.createdAt ?? new Date().toISOString(),
      capability: created.capability ?? "deploy",
      id: created.id ?? createData.id,
    };

    if (!normalized.id) {
      return NextResponse.json(
        { error: "Deploy request created but response did not include an id." },
        { status: 502 }
      );
    }

    const prMeta = await fetchPrMeta(repo, prNumber);
    return NextResponse.json({ request: buildRequestSummary(normalized, prMeta) });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create request.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
