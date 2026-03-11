"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ChevronDown, CircleX, ExternalLink, FileCode2, GitPullRequest, ShieldCheck } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";

type GithubPrMetadata = {
  owner?: string;
  repo?: string;
  pr_number?: number;
  title?: string;
  description?: string;
  files_changed?: string[];
};

type RiskSignal = {
  label: string;
  severity: "critical" | "high" | "medium" | "low";
  reason: string;
};

type PrFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
};

type Enrichment = {
  diff?: {
    title: string;
    body: string | null;
    files: PrFile[];
    total_additions: number;
    total_deletions: number;
    total_files: number;
    head_branch: string;
    base_branch: string;
  } | null;
  risk_signals?: RiskSignal[];
  ai_summary?: string | null;
};

type ReviewRequest = {
  id?: string;
  action?: string;
  resource?: string;
  actor?: string;
  requested_by?: string;
  risk_tier?: string;
  scope?: string | string[];
  timestamp?: string;
  created_at?: string;
  status?: string;
  supersededByRequestId?: string | null;
  pr_merged?: boolean;
  pr_merge_sha?: string | null;
  pr_state?: string | null;
  github_pr?: GithubPrMetadata;
  enrichment?: Enrichment | null;
  preview_url?: string | null;
};

type MergeState =
  | { status: "idle" }
  | { status: "merging" }
  | { status: "merged"; message?: string }
  | { status: "error"; message?: string };

type DecisionState =
  | { status: "idle" }
  | { status: "submitting"; action: "approve" | "reject" }
  | { status: "approved"; receiptId: string | null; hasPr: boolean }
  | { status: "rejected" }
  | { status: "error"; message: string };

type ReviewPageClientProps = {
  id: string;
};

const reasonPresets = ["Reviewed", "LGTM", "Routine deploy"] as const;

function formatTimestamp(input?: string): string {
  if (!input) {
    return "Unknown";
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return input;
  }
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short"
  });
}

function normalizeErrorMessage(status: number, body: unknown): string {
  if (status === 404) {
    return "Request not found.";
  }

  if (typeof body === "object" && body && "error" in body && typeof body.error === "string") {
    return body.error;
  }

  if (status === 409) {
    return "This request was already decided.";
  }

  return "Unable to complete this request.";
}

export function ReviewPageClient({ id }: ReviewPageClientProps) {
  const [request, setRequest] = useState<ReviewRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [decisionState, setDecisionState] = useState<DecisionState>({ status: "idle" });
  const resultRef = useRef<HTMLDivElement>(null);

  // Initial load + real-time polling while pending
  useEffect(() => {
    const controller = new AbortController();

    async function loadRequest(isPolling = false) {
      if (!isPolling) {
        setLoading(true);
        setFetchError(null);
      }

      try {
        const response = await fetch(`/api/review/${id}`, { signal: controller.signal });
        const body = (await response.json().catch(() => ({}))) as unknown;

        if (!response.ok) {
          if (!isPolling) setFetchError(normalizeErrorMessage(response.status, body));
          return;
        }

        setRequest(body as ReviewRequest);
      } catch (error) {
        if ((error as Error).name !== "AbortError" && !isPolling) {
          setFetchError("Network error while loading this request.");
        }
      } finally {
        if (!controller.signal.aborted && !isPolling) {
          setLoading(false);
        }
      }
    }

    void loadRequest();

    // Poll every 15s while request is pending
    const interval = setInterval(() => {
      if (!controller.signal.aborted) {
        void loadRequest(true);
      }
    }, 15000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [id]);

  const statusBadge = useMemo(() => {
    const risk = request?.risk_tier?.toLowerCase();
    if (risk === "high" || risk === "critical") {
      return "border-danger/60 bg-danger/15 text-danger";
    }
    if (risk === "medium") {
      return "border-warning/60 bg-warning/15 text-warning";
    }
    return "border-[#10B981]/50 bg-[#10B981]/15 text-[#10B981]";
  }, [request?.risk_tier]);

  const isPending = request?.status === "pending";
  const isAlreadyDecided = request?.status === "approved" || request?.status === "denied" || request?.status === "expired" || request?.status === "superseded" || request?.status === "cancelled";
  const showAuditTrailLink = Boolean(request?.id && (request.status === "approved" || request.status === "denied" || request.status === "expired"));
  const canAct = !loading && !fetchError && !!request && isPending && decisionState.status !== "approved" && decisionState.status !== "rejected";

  async function submitDecision(action: "approve" | "reject") {
    setDecisionState({ status: "submitting", action });

    try {
      const response = await fetch(`/api/review/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined })
      });

      const body = (await response.json().catch(() => ({}))) as {
        receipt_id?: string;
        error?: string;
        has_pr?: boolean;
      };
      if (!response.ok) {
        setDecisionState({ status: "error", message: normalizeErrorMessage(response.status, body) });
        return;
      }

      if (action === "approve") {
        setDecisionState({
          status: "approved",
          receiptId: body.receipt_id ?? null,
          hasPr: (body as any).has_pr ?? false,
        });
        return;
      }

      setDecisionState({ status: "rejected" });
    } catch {
      setDecisionState({ status: "error", message: "Network error while submitting decision." });
    }
  }

  const [mergeState, setMergeState] = useState<MergeState>({ status: "idle" });

  async function submitMerge() {
    setMergeState({ status: "merging" });
    try {
      const response = await fetch(`/api/review/${id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = (await response.json().catch(() => ({}))) as {
        merged?: boolean;
        message?: string;
        error?: string;
      };
      if (!response.ok) {
        setMergeState({ status: "error", message: body.error ?? "Merge failed." });
        return;
      }
      if (body.merged) {
        setMergeState({ status: "merged", message: body.message });
      } else {
        setMergeState({ status: "error", message: body.message ?? "Merge could not be completed." });
      }
    } catch {
      setMergeState({ status: "error", message: "Network error while merging." });
    }
  }

  return (
    <section className="min-h-screen bg-void px-4 py-6 sm:px-6 md:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/review" className="mb-4 inline-flex items-center gap-1 text-xs text-secondary hover:text-permit transition-colors">
          ← All Requests
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="sticky top-4 z-20 mb-5 rounded-2xl border border-border bg-card/95 p-2.5 shadow-[0_16px_36px_rgba(0,0,0,0.4)] backdrop-blur"
        >
          {isAlreadyDecided ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3 py-2">
              {request?.status === "approved" ? (
                <p className="inline-flex items-center gap-2 text-sm font-medium text-[#10B981]">
                  <CheckCircle2 className="h-4 w-4" />
                  Approved
                </p>
              ) : request?.status === "denied" ? (
                <p className="inline-flex items-center gap-2 text-base font-semibold text-danger">
                  <CircleX className="h-5 w-5" />
                  Denied
                </p>
              ) : request?.status === "superseded" && request?.supersededByRequestId ? (
                <div className="flex flex-col gap-2">
                  <p className="inline-flex items-center gap-2 text-base font-semibold text-muted">
                    <AlertTriangle className="h-5 w-5" />
                    Superseded by newer version
                  </p>
                  <Link
                    href={`/review/${request.supersededByRequestId}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white hover:bg-[#2563EB]"
                  >
                    View latest request →
                  </Link>
                </div>
              ) : (
                <p className="inline-flex items-center gap-2 text-base font-semibold text-muted">
                  <AlertTriangle className="h-5 w-5" />
                  {request?.status === "expired" ? "Expired" : request?.status === "superseded" ? "Superseded" : "Cancelled"}
                </p>
              )}
              </div>

              {request?.pr_merged ? (
                <div className="rounded-xl border border-[#10B981]/50 bg-[#10B981]/10 p-4">
                  <p className="text-sm font-semibold text-[#10B981]">✓ PR merged on GitHub</p>
                  {request.pr_merge_sha ? (
                    <p className="mt-1 font-mono text-xs text-secondary">{request.pr_merge_sha.slice(0, 7)}</p>
                  ) : null}
                </div>
              ) : request?.status === "approved" && request?.github_pr?.owner && request?.github_pr?.pr_number && mergeState.status === "idle" ? (
                <button
                  onClick={() => void submitMerge()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-4 text-lg font-bold text-white shadow-lg shadow-[#3B82F6]/25 hover:bg-[#2563EB] hover:shadow-[#3B82F6]/40 transition-all"
                >
                  🚀 Merge &amp; Deploy
                </button>
              ) : request?.status === "approved" && mergeState.status === "idle" ? (
                <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 p-3 text-center">
                  <p className="text-xs text-secondary">No PR linked — merge manually on GitHub</p>
                </div>
              ) : null}

              {mergeState.status === "merging" ? (
                <div className="rounded-xl border border-[#6366F1]/50 bg-[#6366F1]/10 p-4">
                  <p className="text-sm font-semibold text-[#6366F1]">Merging…</p>
                </div>
              ) : null}

              {mergeState.status === "merged" ? (
                <div className="rounded-xl border border-[#10B981]/50 bg-[#10B981]/10 p-4">
                  <p className="text-sm font-semibold text-[#10B981]">✓ PR merged on GitHub</p>
                </div>
              ) : null}

              {mergeState.status === "error" ? (
                <div className="space-y-2">
                  <div className="rounded-xl border border-danger/50 bg-danger/15 p-4">
                    <p className="text-sm font-semibold text-danger">Merge failed</p>
                    <p className="mt-1 text-xs text-secondary">{mergeState.message}</p>
                  </div>
                  <button
                    onClick={() => { setMergeState({ status: "idle" }); void submitMerge(); }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-4 py-3 font-semibold text-white hover:bg-[#5558E6] transition-colors"
                  >
                    🔄 Retry Merge
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2.5">
              <div>
                <div className="mb-1.5 flex flex-wrap gap-1.5">
                  {reasonPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setReason(preset)}
                      className={`rounded-md border px-2 py-0.5 text-[11px] transition-colors ${
                        reason === preset
                          ? "border-permit bg-permit/15 text-permit"
                          : "border-border bg-card text-secondary hover:text-signal hover:border-permit/40"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for approval or rejection (optional)"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-signal placeholder:text-secondary/50 focus:border-permit focus:outline-none focus:ring-1 focus:ring-permit/40"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  disabled={!canAct || decisionState.status === "submitting"}
                  onClick={() => void submitDecision("approve")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#10B981] px-3 py-2.5 text-sm font-semibold text-void disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {decisionState.status === "submitting" && decisionState.action === "approve" ? "Approving..." : "Approve"}
                </button>
                <button
                  disabled={!canAct || decisionState.status === "submitting"}
                  onClick={() => void submitDecision("reject")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-danger bg-danger/10 px-3 py-2.5 text-sm font-semibold text-signal disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CircleX className="h-4 w-4" />
                  {decisionState.status === "submitting" && decisionState.action === "reject" ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {showAuditTrailLink ? (
          <a
            href={`https://app.permissionprotocol.com/pp/deploy-requests/${request?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-5 inline-block text-xs text-secondary transition-colors hover:text-permit"
          >
            🔐 View full audit trail → app.permissionprotocol.com/pp/deploy-requests/{request?.id}
          </a>
        ) : null}

        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: "easeOut", delay: 0.06 }}
          className="rounded-[28px] border border-border bg-ash p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:p-8"
        >
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-7 w-52 rounded bg-card" />
              <div className="h-4 w-40 rounded bg-card" />
              <div className="h-24 rounded-xl bg-card" />
              <div className="h-24 rounded-xl bg-card" />
            </div>
          ) : null}

          {!loading && fetchError ? (
            <div className="rounded-xl border border-danger/50 bg-danger/15 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-danger">
                <AlertTriangle className="h-4 w-4" />
                {fetchError}
              </p>
            </div>
          ) : null}

          {!loading && !fetchError && request ? (
            <>
              {/* PR title as page heading */}
              <div className="mb-4">
                <h1 className="text-xl font-bold text-signal">
                  {request.github_pr?.title ?? request.action ?? "Deploy Request"}
                </h1>
                <p className="mt-1 flex items-center gap-2 text-xs text-secondary">
                  <GitPullRequest className="h-3 w-3" />
                  {request.resource}
                  {request.github_pr?.pr_number ? ` · PR #${request.github_pr.pr_number}` : ""}
                  {request.actor && request.actor !== "CI" ? ` · ${request.actor}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {isPending ? (
                  <p className="inline-flex items-center gap-2 rounded-full border border-warning/60 bg-warning/15 px-4 py-2 text-sm font-bold text-warning">
                    <ShieldCheck className="h-4 w-4" />
                    REVIEW REQUIRED
                  </p>
                ) : request?.status === "approved" ? (
                  <p className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/60 bg-[#10B981]/15 px-4 py-2 text-sm font-bold text-[#10B981]">
                    <CheckCircle2 className="h-4 w-4" />
                    APPROVED
                  </p>
                ) : request?.status === "denied" ? (
                  <p className="inline-flex items-center gap-2 rounded-full border border-danger/60 bg-danger/15 px-4 py-2 text-sm font-bold text-danger">
                    <CircleX className="h-4 w-4" />
                    DENIED
                  </p>
                ) : (
                  <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-muted uppercase">
                    <AlertTriangle className="h-4 w-4" />
                    {request?.status ?? "Unknown"}
                  </p>
                )}
                <p className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${statusBadge}`}>
                  Risk: {request.risk_tier ?? "Unknown"}
                </p>
              </div>

              <div
                className={`mt-6 rounded-xl border p-5 ${
                  request.enrichment?.risk_signals && request.enrichment.risk_signals.length > 0
                    ? "border-warning/40 bg-warning/5"
                    : "border-permit/30 bg-permit/5"
                }`}
              >
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-permit">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  AI Assessment
                </p>
                <p className="mt-3 text-base leading-relaxed text-signal">
                  {request.enrichment?.ai_summary ?? "No AI assessment provided for this request."}
                </p>

                {request.enrichment?.risk_signals && request.enrichment.risk_signals.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {request.enrichment.risk_signals.map((signal) => (
                      <span
                        key={signal.label}
                        title={signal.reason}
                        className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium ${
                          signal.severity === "critical"
                            ? "border-danger/60 bg-danger/15 text-danger"
                            : signal.severity === "high"
                            ? "border-warning/60 bg-warning/15 text-warning"
                            : "border-border bg-void/50 text-secondary"
                        }`}
                      >
                        {signal.severity === "critical" ? "CRITICAL" : signal.severity.toUpperCase()} · {signal.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
                <div className="flex min-w-max items-center divide-x divide-border">
                  <div className="px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Action</p>
                    <p className="mt-1 text-sm font-semibold text-signal">{request.action ?? "Unknown action"}</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Resource</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-sm font-semibold text-signal">{request.resource ?? "Unknown resource"}</p>
                      {request.github_pr?.owner && request.github_pr?.repo && request.github_pr?.pr_number ? (
                        <a
                          href={`https://github.com/${request.github_pr.owner}/${request.github_pr.repo}/pull/${request.github_pr.pr_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-void/50 px-2 py-0.5 text-xs font-medium text-permit hover:border-permit/40 hover:text-[#6ac9b7] transition-colors"
                        >
                          PR #{request.github_pr.pr_number}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Actor</p>
                    <p className="mt-1 text-sm font-semibold text-signal">{request.actor ?? request.requested_by ?? "Unknown actor"}</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Scope</p>
                    <p className="mt-1 text-sm font-semibold text-signal">
                      {Array.isArray(request.scope) ? request.scope.join(", ") : request.scope ?? "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {request.enrichment?.diff ? (
                <details className="mt-4 rounded-xl border border-border bg-card p-4" open={isPending}>
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-signal">
                    <span className="inline-flex items-center gap-2">
                      <FileCode2 className="h-4 w-4 text-permit" />
                      {request.enrichment.diff.total_files} files changed
                      <span className="text-xs font-normal text-[#10B981]">+{request.enrichment.diff.total_additions}</span>
                      <span className="text-xs font-normal text-danger">-{request.enrichment.diff.total_deletions}</span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted" />
                  </summary>
                  <div className="mt-3 space-y-1">
                    {request.enrichment.diff.files.map((file) => (
                      <div key={file.filename} className="flex items-center justify-between rounded-lg border border-border bg-void/30 px-3 py-1.5">
                        <span className="max-w-[70%] truncate font-mono text-xs text-secondary">{file.filename}</span>
                        <span className="flex items-center gap-2 text-xs">
                          {file.additions > 0 ? <span className="text-[#10B981]">+{file.additions}</span> : null}
                          {file.deletions > 0 ? <span className="text-danger">-{file.deletions}</span> : null}
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            file.status === "added" ? "bg-[#10B981]/15 text-[#10B981]"
                            : file.status === "removed" ? "bg-danger/15 text-danger"
                            : file.status === "renamed" ? "bg-[#6366F1]/15 text-[#6366F1]"
                            : "bg-warning/15 text-warning"
                          }`}>
                            {file.status}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-muted">
                    {request.enrichment.diff.head_branch} → {request.enrichment.diff.base_branch}
                  </p>
                </details>
              ) : request.github_pr ? (
                <details className="mt-6 rounded-xl border border-border bg-card p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-signal">
                    <span className="inline-flex items-center gap-2">
                      <GitPullRequest className="h-4 w-4 text-permit" />
                      GitHub PR Context
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted" />
                  </summary>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted">Title</p>
                      <p className="mt-1 text-sm font-semibold text-signal">{request.github_pr.title ?? "Untitled PR"}</p>
                    </div>
                  </div>
                </details>
              ) : null}

              <div className="mt-4 rounded-xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Timestamp</p>
                <p className="mt-1 text-sm text-secondary">{formatTimestamp(request.timestamp ?? request.created_at)}</p>
              </div>

              {request.preview_url ? (
                <details className="mt-6 rounded-xl border border-permit/30 bg-card p-4" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-signal">
                    <span className="inline-flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-permit" />
                      Live Preview
                    </span>
                    <a
                      href={request.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-permit hover:underline"
                    >
                      Open in new tab ↗
                    </a>
                  </summary>
                  <div className="mt-3 overflow-hidden rounded-lg border border-border">
                    <iframe
                      src={request.preview_url}
                      title="Vercel Preview"
                      className="h-[400px] w-full bg-white"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </details>
              ) : null}

            </>
          ) : null}
        </motion.article>

        {decisionState.status === "approved" ? (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onAnimationComplete={() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="mt-5 space-y-3"
          >
            <div className="rounded-xl border border-[#10B981]/50 bg-[#10B981]/15 p-4">
              <p className="text-sm font-semibold text-[#10B981]">✓ Request approved</p>
              {decisionState.receiptId ? (
                <Link className="mt-1 inline-block text-sm font-semibold text-permit hover:text-[#6ac9b7]" href={`/r/${decisionState.receiptId}`}>
                  Receipt: {decisionState.receiptId.slice(0, 24)}…
                </Link>
              ) : (
                <p className="mt-1 text-sm text-secondary">Receipt generated.</p>
              )}
            </div>

            {decisionState.hasPr && mergeState.status === "idle" ? (
              <button
                onClick={() => void submitMerge()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-4 py-3 font-semibold text-white hover:bg-[#5558E6] transition-colors"
              >
                🚀 Merge &amp; Deploy
              </button>
            ) : null}

            {mergeState.status === "merging" ? (
              <div className="rounded-xl border border-[#6366F1]/50 bg-[#6366F1]/10 p-4">
                <p className="text-sm font-semibold text-[#6366F1]">Merging…</p>
              </div>
            ) : null}

            {mergeState.status === "merged" ? (
              <div className="rounded-xl border border-[#10B981]/50 bg-[#10B981]/10 p-4">
                <p className="text-sm font-semibold text-[#10B981]">✓ PR merged on GitHub</p>
              </div>
            ) : null}

            {mergeState.status === "error" ? (
              <div className="space-y-2">
                <div className="rounded-xl border border-danger/50 bg-danger/15 p-4">
                  <p className="text-sm font-semibold text-danger">Merge failed</p>
                  <p className="mt-1 text-xs text-secondary">{mergeState.message}</p>
                </div>
                <button
                  onClick={() => { setMergeState({ status: "idle" }); void submitMerge(); }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-4 py-3 font-semibold text-white hover:bg-[#5558E6] transition-colors"
                >
                  🔄 Retry Merge
                </button>
              </div>
            ) : null}
          </motion.div>
        ) : null}

        {decisionState.status === "rejected" ? (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onAnimationComplete={() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="mt-5 rounded-xl border border-danger/50 bg-danger/15 p-4"
          >
            <p className="text-sm font-semibold text-danger">Request rejected and blocked.</p>
          </motion.div>
        ) : null}

        {decisionState.status === "error" ? (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onAnimationComplete={() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="mt-5 rounded-xl border border-danger/50 bg-danger/15 p-4"
          >
            <p className="text-sm font-semibold text-danger">{decisionState.message}</p>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
