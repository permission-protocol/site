import { getPPAuthHeaders } from "@/app/api/review/auth";
import { PP_BASE_URL, fetchDeployRequestsByStatuses } from "@/app/api/review/lib/shared";

type AnyRecord = Record<string, any>;

const ALL_STATUSES = ["pending", "approved", "denied", "expired", "superseded", "cancelled"];

export type ReceiptViewData = {
  id: string;
  action: string | null;
  action_label: string | null;
  repo: string | null;
  pr_number: number | null;
  pr_url: string | null;
  commit_sha: string | null;
  commit_url: string | null;
  approved_by: string | null;
  approved_by_url: string | null;
  actor: string | null;
  policy: string | null;
  timestamp: string | null;
  created_at: string | null;
  approved_at: string | null;
  merge_unblocked_at: string | null;
  signature: string | null;
  signature_verified: boolean | null;
  signature_status: "verified" | "not_verified" | "unknown";
  status: string | null;
  request_id: string | null;
  technical_json: Record<string, unknown>;
  raw: {
    request: AnyRecord | null;
    receipt: AnyRecord | null;
  };
};

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as AnyRecord) : null;
}

function collectRequests(data: AnyRecord | null): AnyRecord[] {
  if (!data) return [];

  const requests = Array.isArray(data.requests) ? [...data.requests] : [];
  if (Array.isArray(data.groups)) {
    for (const group of data.groups) {
      if (group?.latestPending) requests.push(group.latestPending);
      if (Array.isArray(group?.requests)) requests.push(...group.requests);
      if (Array.isArray(group?.items)) requests.push(...group.items);
      if (Array.isArray(group?.history)) requests.push(...group.history);
    }
  }

  const directRequest =
    asRecord(data.request) ??
    asRecord(data.deployRequest) ??
    asRecord(data.result) ??
    (data.id ? data : null);
  if (directRequest) requests.push(directRequest);

  return requests.filter(Boolean);
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function extractUsername(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim().replace(/^@/, "");
    return trimmed || null;
  }
  const record = asRecord(value);
  return firstString(record?.username, record?.login, record?.github, record?.name);
}

function matchReceiptId(request: AnyRecord | null, receiptId: string) {
  if (!request) return false;
  return [
    request.receiptId,
    request.receipt_id,
    request?.receipt?.id,
    request?.receipt?.receipt_id,
    request?.result?.receiptId,
    request?.result?.receipt?.id,
  ].some((value) => value === receiptId);
}

function normalizeReceiptPayload(payload: unknown): AnyRecord | null {
  const record = asRecord(payload);
  if (!record) return null;
  return asRecord(record.receipt) ?? asRecord(record.result) ?? record;
}

async function fetchJson(url: string, headers: Record<string, string>) {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json", ...headers },
    cache: "no-store",
  });
  if (!response.ok) return { ok: false as const, status: response.status, data: null };
  return {
    ok: true as const,
    status: response.status,
    data: (await response.json().catch(() => null)) as AnyRecord | null,
  };
}

async function fetchRequestByReceiptId(receiptId: string, headers: Record<string, string>) {
  const queryResult = await fetchJson(
    `${PP_BASE_URL}/deploy-requests?receiptId=${encodeURIComponent(receiptId)}`,
    headers
  );

  if (queryResult.ok) {
    const requests = collectRequests(queryResult.data);
    const request = requests.find((item) => matchReceiptId(item, receiptId)) ?? (requests.length === 1 ? requests[0] : null);
    if (request) return request;
  }

  const allRequests = await fetchDeployRequestsByStatuses(ALL_STATUSES, 200);
  return allRequests.find((item) => matchReceiptId(item, receiptId)) ?? null;
}

function buildActionLabel(action: string | null, env: string | null, resource: string | null) {
  if (action && env) return `${action} -> ${env}`;
  if (action && resource) return `${action} -> ${resource}`;
  return action ?? resource ?? null;
}

function resolveSignatureVerified(request: AnyRecord | null, receipt: AnyRecord | null) {
  const candidates = [
    receipt?.verified,
    receipt?.signatureVerified,
    receipt?.signature_valid,
    receipt?.isValid,
    request?.receiptVerified,
    request?.signatureVerified,
  ];

  for (const value of candidates) {
    if (typeof value === "boolean") return value;
  }

  const status = firstString(
    receipt?.signatureStatus,
    receipt?.signature_status,
    receipt?.verificationStatus,
    receipt?.verification_status
  )?.toLowerCase();

  if (status === "verified" || status === "valid") return true;
  if (status === "not_verified" || status === "invalid" || status === "failed") return false;

  return null;
}

export async function fetchReceiptViewData(receiptId: string): Promise<ReceiptViewData | null> {
  const id = receiptId.trim();
  if (!id) return null;

  const authHeaders = await getPPAuthHeaders();
  const directReceiptResult = await fetchJson(`${PP_BASE_URL}/receipts/${encodeURIComponent(id)}`, authHeaders);
  const receipt = directReceiptResult.ok ? normalizeReceiptPayload(directReceiptResult.data) : null;
  const request = await fetchRequestByReceiptId(id, authHeaders);

  if (!receipt && !request) return null;

  const nestedReceipt = asRecord(request?.receipt);
  const receiptRecord = receipt ?? nestedReceipt;
  const repo = firstString(request?.repo, receiptRecord?.repo, receiptRecord?.resource);
  const prNumber = firstNumber(request?.prNumber, request?.pr_number, receiptRecord?.prNumber, receiptRecord?.pr_number);
  const commitSha = firstString(
    request?.headSha,
    request?.head_sha,
    request?.commitSha,
    request?.commit_sha,
    receiptRecord?.headSha,
    receiptRecord?.head_sha,
    receiptRecord?.commitSha,
    receiptRecord?.commit_sha
  );
  const approvedBy = extractUsername(
    request?.approved_by ??
      request?.approvedBy ??
      receiptRecord?.approved_by ??
      receiptRecord?.approvedBy ??
      receiptRecord?.signer ??
      receiptRecord?.approvedByUser
  );
  const action = firstString(request?.capability, request?.action, receiptRecord?.action, receiptRecord?.capability);
  const env = firstString(request?.env, request?.environment, receiptRecord?.env, receiptRecord?.environment);
  const resource = firstString(request?.resource, receiptRecord?.resource, env, repo);
  const signatureVerified = resolveSignatureVerified(request, receiptRecord);
  const signatureStatus =
    signatureVerified === true ? "verified" : signatureVerified === false ? "not_verified" : "unknown";
  const createdAt = firstString(request?.createdAt, request?.created_at, receiptRecord?.createdAt, receiptRecord?.created_at);
  const approvedAt = firstString(
    request?.approvedAt,
    request?.approved_at,
    request?.decidedAt,
    request?.decided_at,
    receiptRecord?.approvedAt,
    receiptRecord?.approved_at,
    request?.updatedAt,
    request?.updated_at
  );
  const mergeUnblockedAt = firstString(
    request?.mergeUnblockedAt,
    request?.merge_unblocked_at,
    request?.unblockedAt,
    request?.unblocked_at,
    request?.mergedAt,
    request?.merged_at
  );
  const timestamp = firstString(
    receiptRecord?.timestamp,
    receiptRecord?.issuedAt,
    receiptRecord?.issued_at,
    receiptRecord?.createdAt,
    receiptRecord?.created_at,
    approvedAt,
    createdAt
  );
  const resolvedId = firstString(
    receiptRecord?.id,
    receiptRecord?.receipt_id,
    request?.receiptId,
    request?.receipt_id,
    id
  ) ?? id;

  return {
    id: resolvedId,
    action,
    action_label: buildActionLabel(action, env, resource),
    repo,
    pr_number: prNumber,
    pr_url: repo && prNumber ? `https://github.com/${repo}/pull/${prNumber}` : null,
    commit_sha: commitSha,
    commit_url: repo && commitSha ? `https://github.com/${repo}/commit/${commitSha}` : null,
    approved_by: approvedBy,
    approved_by_url: approvedBy ? `https://github.com/${approvedBy}` : null,
    actor: firstString(request?.createdByRef, request?.actor, request?.requested_by, receiptRecord?.actor),
    policy: firstString(request?.policy, request?.policyName, request?.capability, receiptRecord?.policy),
    timestamp,
    created_at: createdAt,
    approved_at: approvedAt,
    merge_unblocked_at: mergeUnblockedAt,
    signature: firstString(receiptRecord?.signature, receiptRecord?.sig, receiptRecord?.proof),
    signature_verified: signatureVerified,
    signature_status: signatureStatus,
    status: firstString(request?.status, receiptRecord?.status),
    request_id: firstString(request?.id, receiptRecord?.requestId, receiptRecord?.request_id),
    technical_json: {
      receipt_id: resolvedId,
      request_id: firstString(request?.id, receiptRecord?.requestId, receiptRecord?.request_id),
      action,
      repo,
      pr_number: prNumber,
      commit_sha: commitSha,
      approved_by: approvedBy,
      created_at: createdAt,
      approved_at: approvedAt,
      merge_unblocked_at: mergeUnblockedAt,
      timestamp,
      signature_status: signatureStatus,
      raw: {
        request,
        receipt: receiptRecord,
      },
    },
    raw: {
      request,
      receipt: receiptRecord,
    },
  };
}
