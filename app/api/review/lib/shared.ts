/**
 * Shared utilities for review API routes.
 * Single source of truth — no copy-pasting across route files.
 */

import { getPPAuthHeaders } from "../auth";

export const PP_BASE_URL = process.env.PP_API_URL || "https://app.permissionprotocol.com/api/v1";
export const GH_API = "https://api.github.com";
export const GH_GQL = "https://api.github.com/graphql";

const STATUSES = ["pending", "approved", "denied", "expired", "superseded", "cancelled"];

export type DeployRequestRecord = Record<string, any>;

export function ghHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

export async function fetchDeployRequestsByStatuses(statuses: string[], limit = 100): Promise<DeployRequestRecord[]> {
  const authHeaders = await getPPAuthHeaders();
  const allRequests: DeployRequestRecord[] = [];

  for (const status of statuses) {
    const response = await fetch(
      `${PP_BASE_URL}/deploy-requests?status=${status}&limit=${limit}`,
      { method: "GET", headers: { Accept: "application/json", ...authHeaders }, cache: "no-store" }
    );
    if (!response.ok) continue;

    const data = await response.json().catch(() => null);
    if (!data) continue;

    const requests = [...(data.requests || [])];
    if (data.groups) {
      for (const group of data.groups) {
        if (group.latestPending) requests.push(group.latestPending);
        if (group.requests) requests.push(...group.requests);
        if (group.items) requests.push(...group.items);
        if (group.history) requests.push(...group.history);
      }
    }

    allRequests.push(...requests);
  }

  const seen = new Set<string>();
  return allRequests.filter((request) => {
    if (!request?.id || seen.has(request.id)) return false;
    seen.add(request.id);
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
    if (request.id === id) {
      return request;
    }
  }
  return null;
}
