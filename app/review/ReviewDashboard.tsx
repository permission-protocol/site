"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock, GitPullRequest, Plus, ShieldCheck } from "lucide-react";
import { FormEvent, TouchEvent, useEffect, useMemo, useState } from "react";

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

type DetailRiskSignal = {
  label: string;
  severity: "critical" | "high" | "medium" | "low";
  reason: string;
};

type DetailRequest = {
  id?: string;
  actor?: string;
  requested_by?: string;
  status?: string;
  current_head_sha?: string | null;
  summary_sha?: string | null;
  enrichment?: {
    ai_summary?: string | null;
    risk_signals?: DetailRiskSignal[];
  } | null;
};

type AuthorTrackRecord = {
  username: string;
  total_deploys: number;
  clean_deploys: number;
  streak: number;
};

type ManualRequestState = {
  repo: string;
  prNumber: string;
  commitSha: string;
  description: string;
};

type ViewMode = "list" | "stack";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-ash px-3 py-2 text-sm text-signal placeholder:text-secondary/70 focus:border-permit focus:outline-none focus:ring-2 focus:ring-permit/30";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

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

function clampIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.min(Math.max(index, 0), length - 1);
}

export function ReviewDashboard() {
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repoFilter, setRepoFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [stackIndex, setStackIndex] = useState(0);
  const [didSetDefaultView, setDidSetDefaultView] = useState(false);
  const [approveAllState, setApproveAllState] = useState<"idle" | "submitting" | "error">("idle");

  function upsertRequest(item: RequestSummary) {
    setRequests((prev) => {
      const exists = prev.some((r) => r.id === item.id);
      if (exists) {
        return prev.map((r) => (r.id === item.id ? item : r));
      }
      return [item, ...prev];
    });
  }

  function updateRequestStatus(id: string, status: string) {
    setRequests((prev) => prev.map((request) => (request.id === id ? { ...request, status } : request)));
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

  const pending = filtered.filter((r) => r.status === "pending");
  const approved = filtered.filter((r) => r.status === "approved");
  const denied = filtered.filter((r) => r.status === "denied");
  const lastApprovedAt = approved
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at;
  const statusChips = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Denied", value: "denied" },
  ];
  const canUseStackView = pending.length >= 2;
  const showApproveAll = pending.length > 0 && pending.every((request) => request.risk_tier === "low" && request.env !== "production");

  useEffect(() => {
    if (!canUseStackView) {
      setViewMode("list");
      setStackIndex(0);
      return;
    }
    if (!didSetDefaultView) {
      setViewMode(window.innerWidth < 768 ? "stack" : "list");
      setDidSetDefaultView(true);
    }
  }, [canUseStackView, didSetDefaultView]);

  useEffect(() => {
    setStackIndex((current) => clampIndex(current, pending.length));
  }, [pending.length]);

  async function approveAllLowRisk() {
    setApproveAllState("submitting");
    try {
      for (const request of pending) {
        const response = await fetch(`/api/review/${request.id}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!response.ok) {
          setApproveAllState("error");
          return;
        }
        updateRequestStatus(request.id, "approved");
      }
      setApproveAllState("idle");
    } catch {
      setApproveAllState("error");
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 pb-12 pt-24">
      <div className="mb-8 flex items-center gap-3">
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
          className="inline-flex items-center gap-2 rounded-lg border border-permit/40 bg-permit/10 px-3 py-2 text-sm font-semibold text-permit transition-colors hover:border-permit hover:bg-permit/15"
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
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Pending</p>
              <p className={`mt-2 text-3xl font-bold ${pending.length > 0 ? "text-warning" : "text-signal"}`}>{pending.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Avg wait time</p>
              <p className="mt-2 text-lg font-semibold text-signal">{averageWait(pending)}</p>
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
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
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
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
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
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
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
            {canUseStackView ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("stack")}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    viewMode === "stack"
                      ? "border-permit bg-permit/15 text-permit"
                      : "border-border bg-card text-secondary hover:border-permit/40 hover:text-signal"
                  }`}
                >
                  Stack view
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    viewMode === "list"
                      ? "border-permit bg-permit/15 text-permit"
                      : "border-border bg-card text-secondary hover:border-permit/40 hover:text-signal"
                  }`}
                >
                  List view
                </button>
                {showApproveAll ? (
                  <button
                    type="button"
                    onClick={() => void approveAllLowRisk()}
                    disabled={approveAllState === "submitting"}
                    className="rounded-full border border-permit/40 bg-permit/10 px-3 py-1.5 text-xs font-semibold text-permit transition-colors hover:bg-permit/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {approveAllState === "submitting" ? "Approving all..." : "Approve All"}
                  </button>
                ) : null}
                {approveAllState === "error" ? (
                  <span className="text-xs text-danger">Approve all stopped after a failed approval.</span>
                ) : null}
              </div>
            ) : null}
          </div>

          {pending.length > 0 && viewMode === "stack" && canUseStackView ? (
            <StackView
              pending={pending}
              activeIndex={stackIndex}
              onIndexChange={setStackIndex}
              onStatusChange={updateRequestStatus}
            />
          ) : null}

          {(viewMode === "list" || !canUseStackView) && pending.length > 0 ? (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-warning">
                <Clock className="h-3.5 w-3.5" />
                Pending Approval ({pending.length})
              </h2>
              <div className="space-y-2">
                {pending.map((r, i) => (
                  <RequestCard key={r.id} request={r} index={i} />
                ))}
              </div>
            </div>
          ) : null}

          {approved.length > 0 && (viewMode === "list" || !canUseStackView) ? (
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

          {denied.length > 0 && (viewMode === "list" || !canUseStackView) ? (
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

function StackView({
  pending,
  activeIndex,
  onIndexChange,
  onStatusChange,
}: {
  pending: RequestSummary[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const activeRequest = pending[clampIndex(activeIndex, pending.length)];
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [translateX, setTranslateX] = useState(0);

  function goNext() {
    onIndexChange(clampIndex(activeIndex + 1, pending.length));
  }

  function goPrevious() {
    onIndexChange(clampIndex(activeIndex - 1, pending.length));
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX === null) return;
    const currentX = event.touches[0]?.clientX ?? touchStartX;
    setTranslateX(currentX - touchStartX);
  }

  function handleTouchEnd() {
    if (translateX <= -100) {
      goNext();
    } else if (translateX >= 100) {
      goPrevious();
    }
    setTouchStartX(null);
    setTranslateX(0);
  }

  if (!activeRequest) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-warning">Stack view</p>
          <p className="text-sm text-secondary">Swipe left for next and right for previous.</p>
        </div>
        <p className="text-xs text-secondary">
          {activeIndex + 1} / {pending.length}
        </p>
      </div>

      <motion.div
        key={activeRequest.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, x: translateX }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "pan-y" }}
      >
        <StackReviewCard
          request={activeRequest}
          onApproved={() => {
            onStatusChange(activeRequest.id, "approved");
            onIndexChange(clampIndex(activeIndex, Math.max(pending.length - 1, 0)));
          }}
          onRejected={() => {
            onStatusChange(activeRequest.id, "denied");
            onIndexChange(clampIndex(activeIndex, Math.max(pending.length - 1, 0)));
          }}
        />
      </motion.div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {pending.map((request, index) => (
          <button
            key={request.id}
            type="button"
            onClick={() => onIndexChange(index)}
            className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-6 bg-permit" : "w-2.5 bg-border hover:bg-secondary"}`}
            aria-label={`Go to request ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function StackReviewCard({
  request,
  onApproved,
  onRejected,
}: {
  request: RequestSummary;
  onApproved: () => void;
  onRejected: () => void;
}) {
  const [detail, setDetail] = useState<DetailRequest | null>(null);
  const [authorTrackRecord, setAuthorTrackRecord] = useState<AuthorTrackRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [decisionState, setDecisionState] = useState<"idle" | "approving" | "rejecting" | "error">("idle");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDetail() {
      setLoading(true);
      setDetail(null);
      setAuthorTrackRecord(null);
      try {
        const response = await fetch(`/api/review/${request.id}`, { signal: controller.signal });
        if (!response.ok) return;
        const body = (await response.json()) as DetailRequest;
        setDetail(body);

        const username = body.actor || body.requested_by;
        if (username && username !== "CI") {
          const authorResponse = await fetch(`/api/review/author/${encodeURIComponent(username)}`, {
            signal: controller.signal,
          });
          if (authorResponse.ok) {
            const authorBody = (await authorResponse.json()) as AuthorTrackRecord;
            setAuthorTrackRecord(authorBody);
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setDetail(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadDetail();

    return () => controller.abort();
  }, [request.id]);

  const trustSummary = authorTrackRecord
    ? authorTrackRecord.total_deploys > 0
      ? `${authorTrackRecord.clean_deploys} clean deploys, streak ${authorTrackRecord.streak}`
      : "New author"
    : detail?.enrichment?.risk_signals?.length
    ? `${detail.enrichment.risk_signals.length} flagged risk signals`
    : "No extra trust signals";
  const isSummaryStale = Boolean(detail?.summary_sha && detail?.current_head_sha && detail.summary_sha !== detail.current_head_sha);

  async function submitDecision(action: "approve" | "reject") {
    setDecisionState(action === "approve" ? "approving" : "rejecting");
    try {
      const response = await fetch(`/api/review/${request.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        setDecisionState("error");
        return;
      }
      if (action === "approve") {
        onApproved();
      } else {
        onRejected();
      }
      setDecisionState("idle");
    } catch {
      setDecisionState("error");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-ash p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-signal">{request.pr_title ?? request.capability}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-secondary">
            <span className="inline-flex items-center gap-1">
              <GitPullRequest className="h-3 w-3" />
              {request.repo}
              {request.pr_number ? ` #${request.pr_number}` : ""}
            </span>
            <span>·</span>
            <span>{request.actor}</span>
            <span>·</span>
            <span>waiting {waitLabel(request.created_at)}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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

      <div className="mt-4 rounded-xl border border-border bg-card/70 p-4">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted">AI summary</p>
        {loading ? (
          <div className="mt-3 h-10 w-full animate-pulse rounded bg-void/60" />
        ) : (
          <>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-signal">
              {detail?.enrichment?.ai_summary ?? "No AI summary available for this request."}
            </p>
            {isSummaryStale ? (
              <p className="mt-2 text-xs text-warning">Summary is stale relative to the latest PR head.</p>
            ) : null}
          </>
        )}
      </div>

      <div className="mt-3 rounded-xl border border-border bg-card/70 p-4">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Trust signals</p>
        <p className="mt-2 text-sm text-signal">{trustSummary}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={decisionState === "approving" || decisionState === "rejecting"}
          onClick={() => void submitDecision("approve")}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#10B981] px-4 py-3 text-sm font-semibold text-void disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 className="h-4 w-4" />
          {decisionState === "approving" ? "Approving..." : "Approve"}
        </button>
        <button
          type="button"
          disabled={decisionState === "approving" || decisionState === "rejecting"}
          onClick={() => void submitDecision("reject")}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-danger bg-danger/10 px-4 py-3 text-sm font-semibold text-signal disabled:cursor-not-allowed disabled:opacity-60"
        >
          <AlertTriangle className="h-4 w-4" />
          {decisionState === "rejecting" ? "Rejecting..." : "Reject"}
        </button>
      </div>

      {decisionState === "error" ? (
        <p className="mt-3 text-sm text-danger">Unable to update this request from stack view.</p>
      ) : null}

      <Link
        href={`/review/${request.id}`}
        className="mt-4 inline-flex text-sm font-medium text-permit transition-colors hover:text-[#6ac9b7]"
      >
        Open full review →
      </Link>
    </div>
  );
}

function RequestCard({ request: r, index }: { request: RequestSummary; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        href={`/review/${r.id}`}
        className={`group block rounded-xl border border-border bg-card px-4 py-5 transition-all hover:border-permit/40 hover:bg-card/80 ${
          r.status === "pending" ? "border-l-4 border-l-warning pl-3" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-start gap-3">
            {statusIcon(r.status)}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-signal transition-colors group-hover:text-permit">
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
                <span>{r.status === "pending" ? `waiting ${waitLabel(r.created_at)}` : timeAgo(r.created_at)}</span>
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
