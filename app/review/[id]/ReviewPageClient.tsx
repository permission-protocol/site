"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ChevronDown, CircleX, FileCode2, GitPullRequest, ShieldCheck, UserRound } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

type GithubPrMetadata = {
  owner?: string;
  repo?: string;
  pr_number?: number;
  title?: string;
  description?: string;
  files_changed?: string[];
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
  github_pr?: GithubPrMetadata;
};

type MergeState =
  | { status: "idle" }
  | { status: "merging" }
  | { status: "merged"; message?: string }
  | { status: "auto-merge"; message?: string }
  | { status: "error"; message: string };

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

  useEffect(() => {
    const controller = new AbortController();

    async function loadRequest() {
      setLoading(true);
      setFetchError(null);

      try {
        const response = await fetch(`/api/review/${id}`, { signal: controller.signal });
        const body = (await response.json().catch(() => ({}))) as unknown;

        if (!response.ok) {
          setFetchError(normalizeErrorMessage(response.status, body));
          return;
        }

        setRequest(body as ReviewRequest);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setFetchError("Network error while loading this request.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadRequest();
    return () => controller.abort();
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
        merge?: MergeInfo | null;
        auto_merge?: AutoMergeInfo | null;
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
        auto_merge?: { enabled: boolean } | null;
      };
      if (!response.ok) {
        setMergeState({ status: "error", message: body.error ?? "Merge failed." });
        return;
      }
      if (body.merged) {
        setMergeState({ status: "merged", message: body.message });
      } else if (body.auto_merge?.enabled) {
        setMergeState({ status: "auto-merge", message: body.message });
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="sticky top-4 z-20 mb-5 rounded-2xl border border-border bg-card/95 p-3 shadow-[0_16px_36px_rgba(0,0,0,0.4)] backdrop-blur"
        >
          {isAlreadyDecided ? (
            <div className="flex items-center justify-center gap-3 py-2">
              {request?.status === "approved" ? (
                <p className="inline-flex items-center gap-2 text-base font-semibold text-[#10B981]">
                  <CheckCircle2 className="h-5 w-5" />
                  Already Approved
                </p>
              ) : request?.status === "denied" ? (
                <p className="inline-flex items-center gap-2 text-base font-semibold text-danger">
                  <CircleX className="h-5 w-5" />
                  Denied
                </p>
              ) : (
                <p className="inline-flex items-center gap-2 text-base font-semibold text-muted">
                  <AlertTriangle className="h-5 w-5" />
                  {request?.status === "expired" ? "Expired" : request?.status === "superseded" ? "Superseded" : "Cancelled"}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                disabled={!canAct || decisionState.status === "submitting"}
                onClick={() => void submitDecision("approve")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#10B981] px-4 py-3 font-semibold text-void disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircle2 className="h-4 w-4" />
                {decisionState.status === "submitting" && decisionState.action === "approve" ? "Approving..." : "Approve"}
              </button>
              <button
                disabled={!canAct || decisionState.status === "submitting"}
                onClick={() => void submitDecision("reject")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-danger bg-danger/10 px-4 py-3 font-semibold text-signal disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CircleX className="h-4 w-4" />
                {decisionState.status === "submitting" && decisionState.action === "reject" ? "Rejecting..." : "Reject"}
              </button>
            </div>
          )}
        </motion.div>

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

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">Action</p>
                  <p className="mt-1 text-base font-semibold text-signal">{request.action ?? "Unknown action"}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">Resource</p>
                  <p className="mt-1 text-base font-semibold text-signal">{request.resource ?? "Unknown resource"}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-muted">
                    <UserRound className="h-3.5 w-3.5" />
                    Actor
                  </p>
                  <p className="mt-1 text-base font-semibold text-signal">{request.actor ?? request.requested_by ?? "Unknown actor"}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">Scope</p>
                  <p className="mt-1 text-base font-semibold text-signal">
                    {Array.isArray(request.scope) ? request.scope.join(", ") : request.scope ?? "Not specified"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Timestamp</p>
                <p className="mt-1 text-sm text-secondary">{formatTimestamp(request.timestamp ?? request.created_at)}</p>
              </div>

              {request.github_pr ? (
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
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted">Description</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-secondary">
                        {request.github_pr.description ?? "No description provided."}
                      </p>
                    </div>
                    {Array.isArray(request.github_pr.files_changed) && request.github_pr.files_changed.length > 0 ? (
                      <div>
                        <p className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-muted">
                          <FileCode2 className="h-3.5 w-3.5" />
                          Files Changed
                        </p>
                        <ul className="mt-2 space-y-1 rounded-lg border border-border bg-void p-3">
                          {request.github_pr.files_changed.map((file) => (
                            <li key={file} className="font-mono text-xs text-secondary">
                              {file}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </details>
              ) : null}

              {isPending ? <div className="mt-6 rounded-xl border border-border bg-card p-4">
                <label htmlFor="decision-reason" className="text-sm font-semibold text-signal">
                  Reason (optional)
                </label>
                <textarea
                  id="decision-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Add review context..."
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-border bg-[#111] px-3 py-2.5 text-sm text-signal placeholder:text-muted"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {reasonPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setReason(preset)}
                      type="button"
                      className="rounded-lg border border-border bg-void px-3 py-1.5 text-sm text-secondary hover:border-permit/60 hover:text-signal"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div> : null}
            </>
          ) : null}
        </motion.article>

        {decisionState.status === "approved" ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
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

            {mergeState.status === "auto-merge" ? (
              <div className="rounded-xl border border-warning/50 bg-warning/10 p-4">
                <p className="text-sm font-semibold text-warning">⏳ Auto-merge enabled</p>
                <p className="mt-1 text-xs text-secondary">{mergeState.message ?? "PR will merge when all checks pass."}</p>
              </div>
            ) : null}

            {mergeState.status === "error" ? (
              <div className="rounded-xl border border-danger/50 bg-danger/15 p-4">
                <p className="text-sm font-semibold text-danger">Merge failed</p>
                <p className="mt-1 text-xs text-secondary">{mergeState.message}</p>
              </div>
            ) : null}
          </motion.div>
        ) : null}

        {decisionState.status === "rejected" ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-xl border border-danger/50 bg-danger/15 p-4"
          >
            <p className="text-sm font-semibold text-danger">Request rejected and blocked.</p>
          </motion.div>
        ) : null}

        {decisionState.status === "error" ? (
          <div className="mt-5 rounded-xl border border-danger/50 bg-danger/15 p-4">
            <p className="text-sm font-semibold text-danger">{decisionState.message}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
