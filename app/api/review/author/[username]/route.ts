import { NextResponse } from "next/server";
import { fetchDeployRequestsByStatuses } from "../../lib/shared";

type AuthorStats = {
  username: string;
  total_deploys: number;
  clean_deploys: number;
  recent_deploys: number;
  avg_approval_time_seconds: number | null;
  streak: number;
};

const AUTHOR_CACHE_TTL_MS = 5 * 60 * 1000;
const authorStatsCache = new Map<string, { data: AuthorStats; expiresAt: number }>();

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function resolveApprovalTimestamp(request: Record<string, any>): string | null {
  return (
    request.approvedAt ||
    request.approved_at ||
    request.updatedAt ||
    request.updated_at ||
    request.decidedAt ||
    request.decided_at ||
    null
  );
}

export async function GET(_: Request, { params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username || "").trim();
  if (!username) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }

  const cacheKey = normalizeUsername(username);
  const cached = authorStatsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data, {
      headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=60" },
    });
  }

  try {
    const requests = await fetchDeployRequestsByStatuses(["pending", "approved", "denied", "expired", "superseded", "cancelled"], 200);
    const matching = requests.filter((request) => {
      const actor = typeof request.actor === "string" ? request.actor : "";
      const requestedBy = typeof request.requested_by === "string" ? request.requested_by : "";
      const createdByRef = typeof request.createdByRef === "string" ? request.createdByRef : "";
      return [actor, requestedBy, createdByRef].some((value) => normalizeUsername(value) === cacheKey);
    });

    const approved = matching
      .filter((request) => request.status === "approved")
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || a.created_at || 0).getTime();
        const bTime = new Date(b.createdAt || b.created_at || 0).getTime();
        return bTime - aTime;
      });

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const approvalDurations = approved
      .map((request) => {
        const createdAt = new Date(request.createdAt || request.created_at || 0).getTime();
        const approvedAt = new Date(resolveApprovalTimestamp(request) || 0).getTime();
        if (!Number.isFinite(createdAt) || !Number.isFinite(approvedAt) || createdAt <= 0 || approvedAt <= 0 || approvedAt < createdAt) {
          return null;
        }
        return approvedAt - createdAt;
      })
      .filter((value): value is number => value !== null);

    let streak = 0;
    for (const request of approved) {
      if (request.status !== "approved") break;
      streak += 1;
    }

    const stats: AuthorStats = {
      username,
      total_deploys: approved.length,
      clean_deploys: approved.length,
      recent_deploys: approved.filter((request) => {
        const createdAt = new Date(request.createdAt || request.created_at || 0).getTime();
        return createdAt >= thirtyDaysAgo;
      }).length,
      avg_approval_time_seconds: approvalDurations.length
        ? Math.round(approvalDurations.reduce((sum, value) => sum + value, 0) / approvalDurations.length / 1000)
        : null,
      streak,
    };

    authorStatsCache.set(cacheKey, { data: stats, expiresAt: now + AUTHOR_CACHE_TTL_MS });
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=60" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to fetch author stats.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
