/**
 * Shared utilities for review API routes.
 * Single source of truth — no copy-pasting across route files.
 */

import { getPPAuthHeaders } from "../auth";

export const PP_BASE_URL = process.env.PP_API_URL || "https://app.permissionprotocol.com/api/v1";
export const GH_API = "https://api.github.com";
export const GH_GQL = "https://api.github.com/graphql";
const GITHUB_PR_STATUS_CACHE_TTL_MS = 5 * 60 * 1000;

const STATUSES = ["pending", "approved", "denied", "expired", "superseded", "cancelled"];
export type DeployRequestRecord = Record<string, any>;
type GithubPrStatus = {
  state: string;
  merged: boolean;
  checkedAt: string;
};

const githubPrStatusCache = new Map<string, { expiresAt: number; value: GithubPrStatus }>();

export function ghHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

export function parseRepoParts(repo?: string | null): { owner: string | null; repoName: string | null } {
  const [owner, repoName] = (repo ?? "").split("/");
  return {
    owner: owner || null,
    repoName: repoName || null,
  };
}

export async function fetchGithubPrStatus(
  repo: string,
  prNumber: number,
  options?: { force?: boolean }
): Promise<GithubPrStatus | null> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return null;

  const { owner, repoName } = parseRepoParts(repo);
  if (!owner || !repoName || !Number.isInteger(prNumber) || prNumber <= 0) return null;

  const cacheKey = `${owner}/${repoName}#${prNumber}`;
  const now = Date.now();
  const cached = githubPrStatusCache.get(cacheKey);
  if (!options?.force && cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const response = await fetch(`${GH_API}/repos/${owner}/${repoName}/pulls/${prNumber}`, {
      headers: ghHeaders(githubToken),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { merged?: boolean; state?: string };
    const value = {
      state: data.state ?? "unknown",
      merged: data.merged ?? false,
      checkedAt: new Date(now).toISOString(),
    };
    githubPrStatusCache.set(cacheKey, { value, expiresAt: now + GITHUB_PR_STATUS_CACHE_TTL_MS });
    return value;
  } catch {
    return null;
  }
}

function collectRequests(data: DeployRequestRecord): DeployRequestRecord[] {
  const requests = Array.isArray(data.requests) ? [...data.requests] : [];
  if (Array.isArray(data.groups)) {
    for (const group of data.groups) {
      if (group.latestPending) requests.push(group.latestPending);
      if (Array.isArray(group.requests)) requests.push(...group.requests);
      if (Array.isArray(group.items)) requests.push(...group.items);
      if (Array.isArray(group.history)) requests.push(...group.history);
    }
  }
  return requests;
}

export async function fetchDeployRequestsByStatuses(
  statuses: string[],
  limit = 100
): Promise<DeployRequestRecord[]> {
  const authHeaders = await getPPAuthHeaders();
  const results = await Promise.all(
    statuses.map(async (status) => {
      const response = await fetch(
        `${PP_BASE_URL}/deploy-requests?status=${status}&limit=${limit}`,
        { method: "GET", headers: { Accept: "application/json", ...authHeaders }, cache: "no-store" }
      );
      if (!response.ok) return [];
      const data = (await response.json().catch(() => null)) as DeployRequestRecord | null;
      if (!data) return [];
      return collectRequests(data);
    })
  );

  const seen = new Set<string>();
  return results.flat().filter((request) => {
    const id = typeof request?.id === "string" ? request.id : "";
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * Fetch a deploy request by ID from PP API.
 * Queries across all statuses since individual-request endpoint uses different auth.
 */
export async function fetchRequestDetails(id: string) {
  const requests = await fetchDeployRequestsByStatuses(STATUSES);
  for (const request of requests) {
    if (request.id === id) return request;
  }
  return null;
}
