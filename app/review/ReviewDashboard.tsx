"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock, GitPullRequest, Plus, ShieldCheck } from "lucide-react";
import { FormEvent, TouchEvent, useEffect, useMemo, useState } from "react";
import { timeAgo } from "@/lib/time";

type RequestSummary = {
  id: string;
  status: string;
  repo: string;
  env: string;
  pr_number: number | null;
  pr_title: string | null;
  actor: string;
  capability: string;
  risk_tier: string;
  created_at: string;
};

type ManualRequestState = {
  repo: string;
  prNumber: string;
  commitSha: string;
  description: string;
};

type ViewMode = "list" | "stack";
type CardVariant = "default" | "stale";

type AuthorTrackRecord = {
  username: string;
  total_deploys: number;
  clean_deploys: number;
  recent_deploys: number;
  avg_approval_time_seconds: number | null;
  streak: number;
};

type StackRequestDetail = {
  id?: string;
  actor?: string;
  requested_by?: string;
  risk_tier?: string;
  status?: string;
  current_head_sha?: string | null;
  summary_sha?: string | null;
  github_pr?: {
    title?: string;
    pr_number?: number;
  };
  enrichment?: {
    ai_summary?: string | null;
  } | null;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-ash px-3 py-2 text-sm text-signal placeholder:text-secondary/70 focus:border-permit focus:outline-none focus:ring-2 focus:ring-permit/30";
const RECONCILE_DEBOUNCE_MS = 5 * 60 * 1000;
let lastReconcileAt = 0;
let cachedStaleIds = new Set<string>();

function waitLabel(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function averageWait(pending: RequestSummary[]): string {
  if (pending.length === 0) return "—";
  const averageMs = pending.reduce((sum, item) => sum + (Date.now() - new Date(item.created_at).getTime()), 0) / pending.length;
  const totalMinutes = Math.max(1, Math.floor(averageMs / 60000));
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

function riskBadge(tier: string) {
  switch (tier) {
    case "critical":
      return "border-danger/70 bg-danger/20 text-danger";
    case "high":
      return "border-danger/50 bg-danger/10 text-danger";
    case "medium":
      return "border-warning/50 bg-warning/10 text-warning";
    case "low":
      return "border-permit/40 bg-permit/10 text-permit";
    default:
      return "border-muted/40 bg-void/40 text-secondary";
  }
}

function statusIcon(status: string) {
  if (status === "pending") return <Clock className="h-4 w-4 text-warning" />;
  if (status === "approved") return <CheckCircle2 className="h-4 w-4 text-[#10B981]" />;
  return <AlertTriangle className="h-4 w-4 text-muted" />;
}

export function ReviewDashboard() {
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [staleIds, setStaleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repoFilter, setRepoFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [stackIndex, setStackIndex] = useState(0);
  const [approveAllState, setApproveAllState] = useState<{ status: "idle" | "submitting" | "error"; message?: string }>({
    status: "idle",
  });
  const [showManualCreate, setShowManualCreate] = useState(false);
  const [manualRequest, setManualRequest] = useState<ManualRequestState>({
    repo: "",
    prNumber: "",
    commitSha: "",
    description: "",
  });
  const [manualSubmitState, setManualSubmitState] = useState<{ status: "idle" | "submitting" | "success" | "error"; message?: string }>({
    status: "idle",
  });

  function upsertRequest(item: RequestSummary) {
    setRequests((prev) => {
      const exists = prev.some((r) => r.id === item.id);
      if (exists) {
        return prev.map((r) => (r.id === item.id ? item : r));
      }
      return [item, ...prev];
    });
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/reviews", { cache: "no-store" });
        if (!res.ok) {
          setError("Failed to load requests.");
          return;
        }
        const data = (await res.json()) as { requests: RequestSummary[] };
        setRequests(data.requests);
      } catch {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  useEffect(() => {
    const pendingIds = requests.filter((request) => request.status === "pending").map((request) => request.id);
    if (pendingIds.length === 0) {
      cachedStaleIds = new Set();
      setStaleIds([]);
      return;
    }

    const now = Date.now();
    if (now - lastReconcileAt < RECONCILE_DEBOUNCE_MS) {
      setStaleIds(pendingIds.filter((id) => cachedStaleIds.has(id)));
      return;
    }

    const controller = new AbortController();

    async function reconcilePending() {
      try {
        const stale = new Set<string>();
        for (let index = 0; index < pendingIds.length; index += 10) {
          const response = await fetch("/api/reviews/reconcile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ request_ids: pendingIds.slice(index, index + 10) }),
            signal: controller.signal,
          });
          if (!response.ok) continue;
          const body = (await response.json()) as { stale_ids?: string[] };
          for (const staleId of body.stale_ids ?? []) {
            stale.add(staleId);
          }
        }

        lastReconcileAt = Date.now();
        cachedStaleIds = stale;
        setStaleIds(Array.from(stale));
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setStaleIds(pendingIds.filter((id) => cachedStaleIds.has(id)));
        }
      }
    }

    void reconcilePending();
    return () => controller.abort();
  }, [requests]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const applyMode = () => setViewMode(media.matches ? "stack" : "list");
    applyMode();
    media.addEventListener("change", applyMode);
    return () => media.removeEventListener("change", applyMode);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const repo = params.get("repo") ?? "";
    const pr = params.get("pr") ?? "";
    const sha = params.get("sha") ?? "";
    const description = params.get("description") ?? "";
    if (!repo && !pr && !sha && !description) return;
    setManualRequest({
      repo,
      prNumber: pr,
      commitSha: sha,
      description,
    });
    setShowManualCreate(true);
  }, []);

  async function submitManualRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManualSubmitState({ status: "submitting" });

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: manualRequest.repo.trim(),
          prNumber: Number(manualRequest.prNumber),
          commitSha: manualRequest.commitSha.trim(),
          description: manualRequest.description.trim(),
        }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        request?: RequestSummary;
      };

      if (!response.ok || !body.request) {
        setManualSubmitState({
          status: "error",
          message: body.error ?? "Unable to create request.",
        });
        return;
      }

      upsertRequest(body.request);
      setManualSubmitState({ status: "success", message: "Deploy request created." });
      setManualRequest((prev) => ({ ...prev, description: "" }));
    } catch {
      setManualSubmitState({ status: "error", message: "Network error while creating request." });
    }
  }

  const repos = useMemo(() => {
    const set = new Set(requests.map((r) => r.repo));
    return Array.from(set).sort();
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (repoFilter !== "all" && r.repo !== repoFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [requests, repoFilter, statusFilter]);

  const pendingSectionHiddenStatuses = new Set(["superseded", "expired"]);
  const pending = filtered.filter((r) => r.status === "pending" && !pendingSectionHiddenStatuses.has(r.status));
  const staleIdSet = useMemo(() => new Set(staleIds), [staleIds]);
  const activePending = pending.filter((r) => !staleIdSet.has(r.id));
  const stalePending = pending.filter((r) => staleIdSet.has(r.id));
  const approved = filtered.filter((r) => r.status === "approved");
  const denied = filtered.filter((r) => r.status === "denied");
  const canApproveAll = activePending.length > 0 && activePending.every((r) => r.risk_tier === "low" && r.env !== "production");
  const lastApprovedAt = approved
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at;
  const statusChips = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Denied", value: "denied" },
  ];

  useEffect(() => {
    if (stackIndex > Math.max(0, activePending.length - 1)) {
      setStackIndex(0);
    }
  }, [activePending.length, stackIndex]);

  async function approveAllPending() {
    setApproveAllState({ status: "submitting" });

    try {
      for (const request of activePending) {
        const response = await fetch(`/api/review/${request.id}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Approved from dashboard bulk action" }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          setApproveAllState({ status: "error", message: body.error ?? `Unable to approve ${request.id}.` });
          return;
        }
      }

      const response = await fetch("/api/reviews", { cache: "no-store" });
      const data = (await response.json()) as { requests: RequestSummary[] };
      setRequests(data.requests);
      setApproveAllState({ status: "idle" });
    } catch {
      setApproveAllState({ status: "error", message: "Network error while approving pending requests." });
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 pt-20 pb-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <ShieldCheck className="h-8 w-8 text-permit" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-signal">Review Queue</h1>
          <p className="text-sm text-secondary">Deploy requests awaiting your decision.</p>
          <a
            href="https://app.permissionprotocol.com/pp/deploy-requests"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs text-secondary transition-colors hover:text-permit"
          >
            View detailed dashboard → app.permissionprotocol.com/pp/deploy-requests
          </a>
        </div>
        <button
          type="button"
          onClick={() => setShowManualCreate((prev) => !prev)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-permit/40 bg-permit/10 px-4 py-2 text-sm font-semibold text-permit transition-colors hover:border-permit hover:bg-permit/15"
        >
          <Plus className="h-4 w-4" />
          Create Request
        </button>
      </div>

      {showManualCreate ? (
        <form onSubmit={submitManualRequest} className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium uppercase tracking-[0.08em] text-secondary">
              Repo
              <input
                value={manualRequest.repo}
                onChange={(event) => setManualRequest((prev) => ({ ...prev, repo: event.target.value }))}
                placeholder="owner/repo"
                className={inputClass}
                required
              />
            </label>
            <label className="text-xs font-medium uppercase tracking-[0.08em] text-secondary">
              PR Number
              <input
                value={manualRequest.prNumber}
                onChange={(event) => setManualRequest((prev) => ({ ...prev, prNumber: event.target.value }))}
                placeholder="123"
                className={inputClass}
                inputMode="numeric"
                pattern="[0-9]+"
                required
              />
            </label>
          </div>
          <div className="mt-3 grid gap-3">
            <label className="text-xs font-medium uppercase tracking-[0.08em] text-secondary">
              Commit SHA
              <input
                value={manualRequest.commitSha}
                onChange={(event) => setManualRequest((prev) => ({ ...prev, commitSha: event.target.value }))}
                placeholder="a1b2c3d4e5f6..."
                className={inputClass}
                required
              />
            </label>
            <label className="text-xs font-medium uppercase tracking-[0.08em] text-secondary">
              Description
              <textarea
                value={manualRequest.description}
                onChange={(event) => setManualRequest((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Why this deploy needs manual approval."
                className={`${inputClass} min-h-24 resize-y`}
              />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-secondary">Prefill supported via URL: `?repo=owner/repo&pr=123&sha=abc123`</p>
            <button
              type="submit"
              disabled={manualSubmitState.status === "submitting"}
              className="rounded-lg bg-permit px-4 py-2 text-sm font-semibold text-void transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {manualSubmitState.status === "submitting" ? "Creating..." : "Create Request"}
            </button>
          </div>
          {manualSubmitState.status === "error" ? (
            <p className="mt-3 text-sm text-danger">{manualSubmitState.message}</p>
          ) : null}
          {manualSubmitState.status === "success" ? (
            <p className="mt-3 text-sm text-[#10B981]">{manualSubmitState.message}</p>
          ) : null}
        </form>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-permit border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-danger/50 bg-danger/10 p-6 text-center">
          <p className="text-sm text-danger">{error}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#10B981]/50" />
          <p className="mt-4 text-lg font-semibold text-signal">All clear</p>
          <p className="mt-1 text-sm text-secondary">No pending requests. You&apos;re up to date.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Pending</p>
              <p className={`mt-2 text-3xl font-bold ${activePending.length > 0 ? "text-warning" : "text-signal"}`}>{activePending.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Avg wait time</p>
              <p className="mt-2 text-lg font-semibold text-signal">{averageWait(activePending)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Last approved</p>
              <p className="mt-2 text-lg font-semibold text-signal">{lastApprovedAt ? timeAgo(lastApprovedAt) : "Never"}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Total shown</p>
              <p className="mt-2 text-lg font-semibold text-signal">{filtered.length}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {statusChips.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setStatusFilter(chip.value)}
                  className={`min-h-11 rounded-full border px-4 py-2 text-xs transition-colors ${
                    statusFilter === chip.value
                      ? "border-permit bg-permit/15 text-permit"
                      : "border-border bg-card text-secondary hover:border-permit/40 hover:text-signal"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            {repos.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setRepoFilter("all")}
                  className={`min-h-11 rounded-full border px-4 py-2 text-xs transition-colors ${
                    repoFilter === "all"
                      ? "border-permit bg-permit/15 text-permit"
                      : "border-border bg-card text-secondary hover:border-permit/40 hover:text-signal"
                  }`}
                >
                  All repos
                </button>
                {repos.map((repo) => (
                  <button
                    key={repo}
                    type="button"
                    onClick={() => setRepoFilter(repo)}
                    className={`min-h-11 rounded-full border px-4 py-2 text-xs transition-colors ${
                      repoFilter === repo
                        ? "border-permit bg-permit/15 text-permit"
                        : "border-border bg-card text-secondary hover:border-permit/40 hover:text-signal"
                    }`}
                  >
                    {repo}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {activePending.length >= 2 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("stack")}
                  className={`min-h-11 rounded-full border px-4 py-2 text-xs transition-colors ${
                    viewMode === "stack"
                      ? "border-permit bg-permit/15 text-permit"
                      : "border-border bg-void/50 text-secondary hover:border-permit/40 hover:text-signal"
                  }`}
                >
                  Stack
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`min-h-11 rounded-full border px-4 py-2 text-xs transition-colors ${
                    viewMode === "list"
                      ? "border-permit bg-permit/15 text-permit"
                      : "border-border bg-void/50 text-secondary hover:border-permit/40 hover:text-signal"
                  }`}
                >
                  List
                </button>
              </div>
              {canApproveAll ? (
                <button
                  type="button"
                  disabled={approveAllState.status === "submitting"}
                  onClick={() => void approveAllPending()}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-permit bg-permit/10 px-4 py-2 text-xs font-semibold text-permit disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {approveAllState.status === "submitting" ? "Approving..." : "Approve All"}
                </button>
              ) : null}
            </div>
          ) : null}
          {approveAllState.status === "error" ? (
            <p className="text-sm text-danger">{approveAllState.message}</p>
          ) : null}

          {activePending.length > 0 ? (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-warning">
                <Clock className="h-3.5 w-3.5" />
                Pending Approval ({activePending.length})
              </h2>
              {viewMode === "stack" && activePending.length >= 2 ? (
                <StackReviewCard
                  request={activePending[stackIndex]}
                  index={stackIndex}
                  total={activePending.length}
                  onAdvance={() => setStackIndex((current) => (current + 1) % activePending.length)}
                  onSelect={(nextIndex) => setStackIndex(nextIndex)}
                  onRefresh={async () => {
                    const response = await fetch("/api/reviews", { cache: "no-store" });
                    if (!response.ok) return;
                    const data = (await response.json()) as { requests: RequestSummary[] };
                    setRequests(data.requests);
                  }}
                />
              ) : (
                <div className="space-y-2">
                  {activePending.map((r, i) => (
                    <RequestCard key={r.id} request={r} index={i} />
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {stalePending.length > 0 ? (
            <details className="rounded-xl border border-border bg-card/70 p-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                <AlertTriangle className="h-3.5 w-3.5" />
                Stale (PR closed) ({stalePending.length})
              </summary>
              <div className="mt-3 space-y-2">
                {stalePending.map((request, index) => (
                  <RequestCard key={request.id} request={request} index={index} variant="stale" />
                ))}
              </div>
            </details>
          ) : null}

          {approved.length > 0 ? (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#10B981]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Recently Approved ({approved.length})
              </h2>
              <div className="space-y-2">
                {approved.map((r, i) => (
                  <RequestCard key={r.id} request={r} index={i} />
                ))}
              </div>
            </div>
          ) : null}

          {denied.length > 0 ? (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-danger">
                <AlertTriangle className="h-3.5 w-3.5" />
                Denied ({denied.length})
              </h2>
              <div className="space-y-2">
                {denied.map((r, i) => (
                  <RequestCard key={r.id} request={r} index={i} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function StackReviewCard({
  request,
  index,
  total,
  onAdvance,
  onSelect,
  onRefresh,
}: {
  request: RequestSummary;
  index: number;
  total: number;
  onAdvance: () => void;
  onSelect: (index: number) => void;
  onRefresh: () => Promise<void>;
}) {
  const [detail, setDetail] = useState<StackRequestDetail | null>(null);
  const [authorTrackRecord, setAuthorTrackRecord] = useState<AuthorTrackRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [translateX, setTranslateX] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [actionState, setActionState] = useState<{ status: "idle" | "submitting" | "error"; message?: string }>({
    status: "idle",
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setActionState({ status: "idle" });

      try {
        const response = await fetch(`/api/review/${request.id}`, { signal: controller.signal });
        if (!response.ok) {
          setDetail(null);
          setAuthorTrackRecord(null);
          return;
        }

        const body = (await response.json()) as StackRequestDetail;
        setDetail(body);

        const username = body.actor ?? body.requested_by;
        if (typeof username !== "string" || !username) {
          setAuthorTrackRecord(null);
          return;
        }
        const authorUsername = username;

        const authorResponse = await fetch(`/api/review/author/${encodeURIComponent(authorUsername)}`, { signal: controller.signal });
        if (!authorResponse.ok) {
          setAuthorTrackRecord(null);
          return;
        }

        const authorBody = (await authorResponse.json()) as AuthorTrackRecord;
        setAuthorTrackRecord(authorBody);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setDetail(null);
          setAuthorTrackRecord(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [request.id]);

  const isSummaryStale = Boolean(detail?.summary_sha && detail?.current_head_sha && detail.summary_sha !== detail.current_head_sha);
  const authorTrustCopy = authorTrackRecord && authorTrackRecord.clean_deploys > 0
    ? `✅ Author: ${authorTrackRecord.clean_deploys} clean deploys (streak: ${authorTrackRecord.streak})`
    : "⚠️ New author: first deploy";

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    setTouchStartX(event.touches[0]?.clientX ?? null);
    setTranslateX(0);
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX == null) return;
    const deltaX = (event.touches[0]?.clientX ?? touchStartX) - touchStartX;
    setTranslateX(deltaX);
  }

  function handleTouchEnd() {
    if (Math.abs(translateX) > 100) {
      onAdvance();
    }
    setTouchStartX(null);
    setTranslateX(0);
  }

  async function submitDecision(action: "approve" | "reject") {
    setActionState({ status: "submitting" });
    try {
      const response = await fetch(`/api/review/${request.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: `Dashboard ${action}` }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setActionState({ status: "error", message: body.error ?? `Unable to ${action} request.` });
        return;
      }

      await onRefresh();
      onAdvance();
    } catch {
      setActionState({ status: "error", message: `Network error while attempting to ${action} request.` });
    }
  }

  return (
    <div className="space-y-3">
      <motion.div
        key={request.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, x: translateX }}
        transition={{ duration: 0.2 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="rounded-2xl border border-border bg-card p-5 shadow-[0_16px_36px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{request.repo}</p>
            <p className="mt-2 text-lg font-semibold text-signal">{request.pr_title ?? request.capability}</p>
            <p className="mt-1 text-sm text-secondary">
              {request.actor}
              {request.pr_number ? ` • PR #${request.pr_number}` : ""}
              {` • waiting ${waitLabel(request.created_at)}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${riskBadge(request.risk_tier)}`}>
              {request.risk_tier}
            </span>
            <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium ${
              request.env === "production"
                ? "border-danger/30 bg-danger/5 text-danger"
                : "border-border bg-void/50 text-secondary"
            }`}>
              {request.env}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-void/40 p-4">
          {loading ? (
            <p className="text-sm text-secondary">Loading assessment…</p>
          ) : (
            <>
              <p className="text-sm text-signal">{detail?.enrichment?.ai_summary ?? "No AI summary available."}</p>
              <div className="mt-3 space-y-2 text-sm text-secondary">
                <p>{authorTrustCopy}</p>
                {isSummaryStale ? <p className="text-warning">Summary is stale relative to the current PR head.</p> : null}
              </div>
            </>
          )}
        </div>

        {actionState.status === "error" ? (
          <p className="mt-3 text-sm text-danger">{actionState.message}</p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={actionState.status === "submitting"}
            onClick={() => void submitDecision("approve")}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#10B981] px-4 py-3 text-sm font-semibold text-void disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionState.status === "submitting" ? "Working..." : "Approve"}
          </button>
          <button
            type="button"
            disabled={actionState.status === "submitting"}
            onClick={() => void submitDecision("reject")}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-danger bg-danger/10 px-4 py-3 text-sm font-semibold text-danger disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      </motion.div>

      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, dotIndex) => (
          <button
            key={dotIndex}
            type="button"
            onClick={() => onSelect(dotIndex)}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              dotIndex === index ? "bg-permit" : "bg-border"
            }`}
            aria-label={`Go to request ${dotIndex + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function RequestCard({ request: r, index, variant = "default" }: { request: RequestSummary; index: number; variant?: CardVariant }) {
  const isStale = variant === "stale";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        href={`/review/${r.id}`}
        className={`group block rounded-xl border px-4 py-5 transition-all ${
          isStale
            ? "border-border/70 bg-card/40 hover:border-border hover:bg-card/50"
            : "border-border bg-card hover:border-permit/40 hover:bg-card/80"
        } ${
          r.status === "pending" && !isStale ? "border-l-4 border-l-warning pl-3" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {isStale ? <AlertTriangle className="h-4 w-4 text-muted" /> : statusIcon(r.status)}
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold transition-colors ${isStale ? "text-secondary group-hover:text-signal" : "text-signal group-hover:text-permit"}`}>
                {r.pr_title ?? r.capability}
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-secondary">
                <span className="inline-flex items-center gap-1">
                  <GitPullRequest className="h-3 w-3" />
                  {r.repo}
                  {r.pr_number ? ` #${r.pr_number}` : ""}
                </span>
                <span>·</span>
                <span>{r.actor}</span>
                <span>·</span>
                <span>{isStale ? "PR closed or merged" : r.status === "pending" ? `waiting ${waitLabel(r.created_at)}` : timeAgo(r.created_at)}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${riskBadge(r.risk_tier)}`}>
              {r.risk_tier}
            </span>
            <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium ${
              r.env === "production"
                ? "border-danger/30 bg-danger/5 text-danger"
                : "border-border bg-void/50 text-secondary"
            }`}>
              {r.env}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
