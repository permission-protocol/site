"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleX,
  ExternalLink,
  FileCode2,
  GitPullRequest,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatTimestamp, timeAgo } from "@/lib/time";

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

type PeerReviews = {
  total: number;
  approved: number;
  changes_requested: number;
  commented: number;
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
    head_sha?: string | null;
  } | null;
  risk_signals?: RiskSignal[];
  ai_summary?: string | null;
  blast_radius?: string | null;
  summary_sha?: string | null;
  summary_generated_at?: string | null;
  peer_reviews?: PeerReviews | null;
};

type AuthorTrackRecord = {
  username: string;
  total_deploys: number;
  clean_deploys: number;
  recent_deploys: number;
  avg_approval_time_seconds: number | null;
  streak: number;
};

type MergeReadiness = {
  mergeable: boolean | null;
  mergeable_state: string | null;
  checks: Array<{
    name: string;
    status: string;
    conclusion: string | null;
  }>;
  checks_passing: number;
  checks_total: number;
  behind_by: number | null;
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
  decided_at?: string;
  status?: string;
  supersededByRequestId?: string | null;
  pr_merged?: boolean;
  pr_merge_sha?: string | null;
  pr_state?: string | null;
  github_pr?: GithubPrMetadata;
  enrichment?: Enrichment | null;
  summary_sha?: string | null;
  current_head_sha?: string | null;
  summary_generated_at?: string | null;
  merge_readiness?: MergeReadiness | null;
  preview_url?: string | null;
};

type MergeState =
  | { status: "idle" }
  | { status: "merging" }
  | { status: "merged"; message?: string }
  | { status: "error"; message?: string };

type UpdateBranchState =
  | { status: "idle" }
  | { status: "updating" }
  | { status: "updated"; message: string }
  | { status: "error"; message: string };

type RerunResult = { ok: boolean; strategy?: string; error?: string } | null;

type DecisionState =
  | { status: "idle" }
  | { status: "submitting"; action: "approve" | "reject" }
  | { status: "approved"; receiptId: string | null; hasPr: boolean; rerunResult: RerunResult }
  | { status: "rejected" }
  | { status: "error"; message: string };

type ReviewPageClientProps = {
  id: string;
};

type RegenerateState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type TrustSignal = {
  id: string;
  title: string;
  summary: string;
  tone: "failure" | "warning" | "success" | "neutral";
  details: string[];
};

type TimelineTone = "neutral" | "success" | "danger" | "warning" | "muted";

type TimelineItem = {
  id: string;
  label: string;
  timestamp?: string | null;
  tone: TimelineTone;
  description?: string;
  isFuture?: boolean;
};

const reasonPresets = ["Reviewed", "LGTM", "Routine deploy"] as const;
const rejectReasonPresets = ["Not ready", "Needs tests", "Wrong branch", "Needs discussion"] as const;
const HOLD_DURATION_MS = 1000;
const UNDO_DURATION_MS = 5000;

function getEnvironmentLabel(request: ReviewRequest | null): string {
  const rawScope = Array.isArray(request?.scope) ? request?.scope[0] : request?.scope;
  const candidate = rawScope?.split("—")[0]?.trim();
  return candidate || "Preview";
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

function getGithubPrUrl(request: ReviewRequest | null): string | null {
  const owner = request?.github_pr?.owner;
  const repo = request?.github_pr?.repo;
  const prNumber = request?.github_pr?.pr_number;
  if (!owner || !repo || !prNumber) return null;
  return `https://github.com/${owner}/${repo}/pull/${prNumber}`;
}

function allChecksPassing(readiness: MergeReadiness | null | undefined): boolean {
  if (!readiness) return false;
  return (
    readiness.checks_passing === readiness.checks_total &&
    readiness.checks.every((check) => check.status === "completed" && check.conclusion === "success")
  );
}

function getCheckSummary(readiness: MergeReadiness | null | undefined): string {
  if (!readiness) return "GitHub checks not available yet.";
  if (readiness.checks_total === 0) {
    return "No check runs reported (0/0)";
  }
  if (allChecksPassing(readiness)) {
    return `Tests passing (${readiness.checks_passing}/${readiness.checks_total})`;
  }
  return `${readiness.checks_total - readiness.checks_passing} check${readiness.checks_total - readiness.checks_passing === 1 ? "" : "s"} failing`;
}

function riskPillClasses(risk?: string): string {
  const normalized = risk?.toLowerCase();
  if (normalized === "critical" || normalized === "high") {
    return "border-danger/60 bg-danger/15 text-danger";
  }
  if (normalized === "medium") {
    return "border-warning/60 bg-warning/15 text-warning";
  }
  return "border-permit/50 bg-permit/10 text-permit";
}

function environmentPillClasses(env?: string): string {
  const normalized = env?.toLowerCase();
  if (normalized === "production") return "bg-[#EF4444] text-white";
  if (normalized === "staging") return "bg-[#F59E0B] text-void";
  return "bg-slate-500 text-white";
}

function riskScoreMeta(request: ReviewRequest | null) {
  const tier = request?.risk_tier?.toLowerCase();
  const topSignal = request?.enrichment?.risk_signals?.[0];

  if (tier === "critical" || tier === "high") {
    return {
      label: "High risk",
      tone: "text-danger",
      chip: "border-danger/50 bg-danger/10 text-danger",
      rationale: topSignal?.reason ?? "Touches production-sensitive surfaces and needs a deliberate review.",
    };
  }

  if (tier === "medium") {
    return {
      label: "Medium risk",
      tone: "text-warning",
      chip: "border-warning/50 bg-warning/10 text-warning",
      rationale: topSignal?.reason ?? "Moderate product impact. Confirm expected behavior and deployment timing.",
    };
  }

  return {
    label: "Low risk",
    tone: "text-permit",
    chip: "border-permit/50 bg-permit/10 text-permit",
    rationale: topSignal?.reason ?? "Scoped change with limited operational impact.",
  };
}

function summaryCopy(request: ReviewRequest | null): string {
  if (request?.enrichment?.ai_summary) return request.enrichment.ai_summary;
  if (request?.github_pr?.description) return request.github_pr.description;
  if (request?.github_pr?.title) return `Deploy request for ${request.github_pr.title}. Review the trust signals before sending this live.`;
  return "No AI assessment is available for this deploy request.";
}

function metadataItems(request: ReviewRequest) {
  return [
    { label: "Action", value: request.action ?? "Unknown action" },
    { label: "Resource", value: request.resource ?? "Unknown resource" },
    { label: "Actor", value: request.actor ?? request.requested_by ?? "Unknown actor" },
    {
      label: "Scope",
      value: Array.isArray(request.scope) ? request.scope.join(", ") : request.scope ?? "Not specified",
    },
  ];
}

function trustToneClasses(tone: TrustSignal["tone"]): string {
  if (tone === "failure") return "border-danger/40 bg-danger/10 text-danger";
  if (tone === "warning") return "border-warning/40 bg-warning/10 text-warning";
  if (tone === "success") return "border-permit/40 bg-permit/10 text-permit";
  return "border-border bg-card text-secondary";
}

function statusCopy(status?: string) {
  if (status === "approved") return { label: "Approved", tone: "text-permit", icon: CheckCircle2 };
  if (status === "denied") return { label: "Denied", tone: "text-danger", icon: CircleX };
  if (status === "superseded") return { label: "Superseded", tone: "text-warning", icon: AlertTriangle };
  if (status === "expired") return { label: "Expired", tone: "text-warning", icon: AlertTriangle };
  if (status === "cancelled") return { label: "Cancelled", tone: "text-warning", icon: AlertTriangle };
  return { label: "Review required", tone: "text-warning", icon: ShieldCheck };
}

function timelineToneClasses(tone: TimelineTone, isFuture: boolean) {
  if (isFuture) {
    return {
      dot: "border-border bg-transparent",
      line: "border-l border-dashed border-border",
      title: "text-muted",
    };
  }

  if (tone === "success") {
    return {
      dot: "border-[#10B981] bg-[#10B981]",
      line: "bg-[#10B981]/40",
      title: "text-permit",
    };
  }

  if (tone === "danger") {
    return {
      dot: "border-danger bg-danger",
      line: "bg-danger/40",
      title: "text-danger",
    };
  }

  if (tone === "warning") {
    return {
      dot: "border-warning bg-warning",
      line: "bg-warning/40",
      title: "text-warning",
    };
  }

  if (tone === "muted") {
    return {
      dot: "border-muted bg-muted",
      line: "bg-border",
      title: "text-secondary",
    };
  }

  return {
    dot: "border-secondary bg-secondary",
    line: "bg-border",
    title: "text-signal",
  };
}

function RequestTimeline({ items, defaultOpen }: { items: TimelineItem[]; defaultOpen: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  return (
    <details className="rounded-3xl border border-border bg-card p-4" open={isOpen} onToggle={(event) => setIsOpen((event.currentTarget as HTMLDetailsElement).open)}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-signal">
        <span>Request timeline</span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </summary>
      <div className="mt-4 space-y-0">
        {items.map((item, index) => {
          const styles = timelineToneClasses(item.tone, Boolean(item.isFuture));
          const isLast = index === items.length - 1;

          return (
            <div key={item.id} className="flex gap-3">
              <div className="flex w-5 flex-col items-center">
                <span className={`mt-1 h-3 w-3 rounded-full border-2 ${styles.dot}`} />
                {!isLast ? (
                  <span
                    className={`mt-1 block min-h-8 ${item.isFuture ? styles.line : `w-px ${styles.line}`}`}
                  />
                ) : null}
              </div>
              <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
                <p className={`text-sm font-semibold ${styles.title}`}>{item.label}</p>
                <p className="mt-1 text-xs text-secondary">
                  {item.timestamp ? formatTimestamp(item.timestamp, { includeSeconds: false }) : "Pending"}
                </p>
                {item.description ? <p className="mt-1 text-sm text-secondary">{item.description}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}

export function ReviewPageClient({ id }: ReviewPageClientProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [request, setRequest] = useState<ReviewRequest | null>(null);
  const [authorTrackRecord, setAuthorTrackRecord] = useState<AuthorTrackRecord | null>(null);
  const requestStateRef = useRef<{ status: string; prMerged: boolean }>({ status: "pending", prMerged: false });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [decisionState, setDecisionState] = useState<DecisionState>({ status: "idle" });
  const [mergeState, setMergeState] = useState<MergeState>({ status: "idle" });
  const [updateBranchState, setUpdateBranchState] = useState<UpdateBranchState>({ status: "idle" });
  const [showRejectSheet, setShowRejectSheet] = useState(false);
  const [regenerateState, setRegenerateState] = useState<RegenerateState>({ status: "idle" });
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [undoExpiresAt, setUndoExpiresAt] = useState<number | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const holdFrameRef = useRef<number | null>(null);
  const holdStartedAtRef = useRef<number | null>(null);

  const loadRequest = useCallback(
    async (isPolling = false, signal?: AbortSignal) => {
      if (!isPolling) {
        setLoading(true);
        setFetchError(null);
      }

      try {
        const response = await fetch(`/api/review/${id}`, signal ? { signal } : undefined);
        const body = (await response.json().catch(() => ({}))) as unknown;

        if (!response.ok) {
          if (!isPolling) setFetchError(normalizeErrorMessage(response.status, body));
          return;
        }

        const nextRequest = body as ReviewRequest;
        setRequest(nextRequest);
        requestStateRef.current = {
          status: nextRequest.status ?? "pending",
          prMerged: nextRequest.pr_merged ?? nextRequest.pr_state === "closed",
        };
      } catch (error) {
        if ((error as Error).name !== "AbortError" && !isPolling) {
          setFetchError("Network error while loading this request.");
        }
      } finally {
        if (!(signal?.aborted) && !isPolling) {
          setLoading(false);
        }
      }
    },
    [id]
  );

  const submitDecision = useCallback(async (action: "approve" | "reject") => {
    setDecisionState({ status: "submitting", action });

    try {
      const response = await fetch(`/api/review/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        receipt_id?: string;
        error?: string;
        has_pr?: boolean;
        rerun_result?: RerunResult;
      };
      if (!response.ok) {
        setDecisionState({ status: "error", message: normalizeErrorMessage(response.status, body) });
        return;
      }

      if (action === "approve") {
        setDecisionState({
          status: "approved",
          receiptId: body.receipt_id ?? null,
          hasPr: body.has_pr ?? false,
          rerunResult: body.rerun_result ?? null,
        });
        void loadRequest(true);
        return;
      }

      setDecisionState({ status: "rejected" });
      setShowRejectSheet(false);
    } catch {
      setDecisionState({ status: "error", message: "Network error while submitting decision." });
    }
  }, [id, loadRequest, reason]);

  useEffect(() => {
    const controller = new AbortController();

    void loadRequest(false, controller.signal);

    const interval = setInterval(() => {
      const shouldPoll =
        requestStateRef.current.status === "pending" ||
        (requestStateRef.current.status === "approved" && !requestStateRef.current.prMerged);
      if (!controller.signal.aborted && shouldPoll) {
        void loadRequest(true, controller.signal);
      }
    }, 15000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [id, loadRequest]);

  useEffect(() => {
    if (updateBranchState.status === "updated" && request?.merge_readiness?.mergeable_state === "clean") {
      setUpdateBranchState({ status: "idle" });
    }
  }, [request?.merge_readiness?.mergeable_state, updateBranchState.status]);

  useEffect(() => {
    const username = request?.actor ?? request?.requested_by;
    if (typeof username !== "string" || !username) {
      setAuthorTrackRecord(null);
      return;
    }
    const authorUsername = username;

    const controller = new AbortController();

    async function loadAuthorTrackRecord() {
      try {
        const response = await fetch(`/api/review/author/${encodeURIComponent(authorUsername)}`, { signal: controller.signal });
        if (!response.ok) {
          setAuthorTrackRecord(null);
          return;
        }

        const body = (await response.json()) as AuthorTrackRecord;
        setAuthorTrackRecord(body);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setAuthorTrackRecord(null);
        }
      }
    }

    void loadAuthorTrackRecord();
    return () => controller.abort();
  }, [request?.actor, request?.requested_by]);

  useEffect(() => {
    if (!undoExpiresAt) return;

    const tick = () => {
      const secondsRemaining = Math.max(0, Math.ceil((undoExpiresAt - Date.now()) / 1000));
      setUndoCountdown(secondsRemaining);
      if (secondsRemaining === 0) {
        setUndoExpiresAt(null);
        void submitDecision("approve");
      }
    };

    tick();
    const interval = window.setInterval(tick, 200);
    return () => window.clearInterval(interval);
  }, [submitDecision, undoExpiresAt]);

  useEffect(() => {
    return () => {
      if (holdFrameRef.current) cancelAnimationFrame(holdFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setTimelineExpanded(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const readiness = request?.merge_readiness ?? null;
  const githubPrUrl = getGithubPrUrl(request);
  const isPending = request?.status === "pending";
  const isStaleRequest = Boolean(
    isPending &&
    request?.github_pr?.pr_number &&
    (request.pr_merged || request.pr_state === "closed")
  );
  const isAlreadyDecided =
    request?.status === "approved" ||
    request?.status === "denied" ||
    request?.status === "expired" ||
    request?.status === "superseded" ||
    request?.status === "cancelled";
  const showAuditTrailLink = Boolean(
    request?.id && (request.status === "approved" || request.status === "denied" || request.status === "expired")
  );
  const canReview =
    !loading &&
    !fetchError &&
    !!request &&
    isPending &&
    !isStaleRequest &&
    decisionState.status !== "approved" &&
    decisionState.status !== "rejected" &&
    !undoExpiresAt;
  const showReviewActions =
    !loading &&
    !fetchError &&
    !!request &&
    isPending &&
    decisionState.status !== "approved" &&
    decisionState.status !== "rejected";
  const isAuthenticated = sessionStatus === "authenticated";
  const approverUsername = session?.user?.name?.trim() ?? session?.login ?? session?.user?.login ?? null;
  const approverAvatar = session?.user?.image ?? null;
  const showChecklist = request?.status === "approved" && !request?.pr_merged;
  const hasLinkedPr = Boolean(request?.github_pr?.owner && request?.github_pr?.repo && request?.github_pr?.pr_number);
  const checksPassing = allChecksPassing(readiness);
  const branchBehind = readiness?.mergeable_state === "behind" || (readiness?.behind_by ?? 0) > 0;
  const hasConflict = readiness?.mergeable_state === "dirty" || readiness?.mergeable === false;
  const canMergeNow = readiness?.mergeable_state === "clean" && checksPassing;
  const checksBlocked = Boolean(readiness) && !checksPassing;
  const mergeBlockedReason = !readiness
    ? "Merge readiness is still being computed."
    : checksBlocked
      ? "Checks must pass before merging."
      : branchBehind
        ? "Update branch before merging."
        : hasConflict
          ? "Resolve merge conflicts on GitHub before merging."
          : "Merge is not available yet.";
  const riskMeta = riskScoreMeta(request);
  const environmentLabel = getEnvironmentLabel(request);
  const needsHoldToApprove =
    environmentLabel.toLowerCase() === "production" ||
    request?.risk_tier?.toLowerCase() === "high" ||
    request?.risk_tier?.toLowerCase() === "critical";
  const relativeTimestamp = timeAgo(request?.timestamp ?? request?.created_at);
  const createdAt = formatTimestamp(request?.timestamp ?? request?.created_at, { includeSeconds: false });
  const blastRadius = request?.enrichment?.blast_radius?.length
    ? request.enrichment.blast_radius
    : "Limited scope";
  const summary = summaryCopy(request);
  const summarySha = request?.summary_sha ?? request?.enrichment?.summary_sha ?? null;
  const currentHeadSha = request?.current_head_sha ?? request?.enrichment?.diff?.head_sha ?? null;
  const summaryGeneratedAt = request?.summary_generated_at ?? request?.enrichment?.summary_generated_at ?? null;
  const isSummaryStale = Boolean(summarySha && currentHeadSha && summarySha !== currentHeadSha);
  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      {
        id: "created",
        label: "Created",
        timestamp: request?.created_at ?? request?.timestamp,
        tone: "neutral",
      },
    ];

    if (request?.status === "approved" || decisionState.status === "approved") {
      items.push({
        id: "approved",
        label: "Approved",
        timestamp: request?.decided_at ?? request?.created_at ?? request?.timestamp,
        tone: "success",
      });

      if (decisionState.status === "approved" && decisionState.rerunResult) {
        items.push({
          id: "rerun",
          label: "Deploy Gate re-triggered",
          timestamp: request?.decided_at ?? new Date().toISOString(),
          tone: decisionState.rerunResult.ok ? "success" : "warning",
          description: decisionState.rerunResult.ok
            ? decisionState.rerunResult.strategy === "check_run"
              ? "Check run re-requested."
              : "Workflow re-run requested."
            : decisionState.rerunResult.error ?? "Automatic re-run did not complete.",
        });
      }
    } else if (request?.status === "denied" || decisionState.status === "rejected") {
      items.push({
        id: "denied",
        label: "Denied",
        timestamp: request?.decided_at ?? request?.created_at ?? request?.timestamp,
        tone: "danger",
      });
    } else if (request?.status === "superseded") {
      items.push({
        id: "superseded",
        label: "Superseded",
        timestamp: request?.decided_at ?? request?.created_at ?? request?.timestamp,
        tone: "warning",
      });
    } else if (request?.status === "expired") {
      items.push({
        id: "expired",
        label: "Expired",
        timestamp: request?.decided_at ?? request?.created_at ?? request?.timestamp,
        tone: "muted",
      });
    } else {
      items.push({
        id: "approved-future",
        label: "Approved",
        tone: "success",
        isFuture: true,
      });
    }

    if (request?.pr_merged || mergeState.status === "merged") {
      items.push({
        id: "merged",
        label: "PR Merged",
        timestamp: request?.decided_at ?? new Date().toISOString(),
        tone: "success",
      });
    } else if (request?.status === "approved" || decisionState.status === "approved") {
      items.push({
        id: "merged-future",
        label: "PR Merged",
        tone: "success",
        isFuture: true,
      });
    }

    return items;
  }, [
    decisionState,
    mergeState.status,
    request?.created_at,
    request?.decided_at,
    request?.pr_merged,
    request?.status,
    request?.timestamp,
  ]);
  const stateMeta = statusCopy(request?.status);
  const StateIcon = stateMeta.icon;
  const authorTrustCopy = authorTrackRecord && authorTrackRecord.clean_deploys > 0
    ? `✅ Author: ${authorTrackRecord.clean_deploys} clean deploy${authorTrackRecord.clean_deploys === 1 ? "" : "s"} (streak: ${authorTrackRecord.streak})`
    : "⚠️ New author: first deploy";

  const trustSignals = useMemo<TrustSignal[]>(() => {
    const items: TrustSignal[] = [];

    if (readiness) {
      const failing = readiness.checks_total - readiness.checks_passing;
      items.push({
        id: "ci",
        title: "CI status",
        summary:
          readiness.checks_total === 0
            ? "No checks reported"
            : failing === 0
              ? `✅ Tests passing (${readiness.checks_passing}/${readiness.checks_total})`
              : `❌ ${failing} check${failing === 1 ? "" : "s"} failing`,
        tone: readiness.checks_total === 0 ? "warning" : failing === 0 ? "success" : "failure",
        details:
          readiness.checks.length > 0
            ? readiness.checks.map((check) => {
                const passed = check.status === "completed" && check.conclusion === "success";
                const pending = check.status !== "completed";
                return `${check.name}: ${pending ? "Pending" : passed ? "Passing" : check.conclusion ?? "Failed"}`;
              })
            : ["No GitHub check runs were reported for this PR."],
      });
    }

    if (request?.enrichment?.peer_reviews) {
      const peer = request.enrichment.peer_reviews;
      items.push({
        id: "peer-reviews",
        title: "Peer review",
        summary:
          peer.total > 0
            ? `${peer.total} reviewer${peer.total === 1 ? "" : "s"} responded`
            : "No reviewer activity recorded",
        tone: peer.changes_requested > 0 ? "warning" : peer.approved > 0 ? "success" : "neutral",
        details: [
          `${peer.approved} approved`,
          `${peer.changes_requested} requested changes`,
          `${peer.commented} commented`,
        ],
      });
    }

    if (request?.enrichment?.risk_signals?.length) {
      for (const signal of request.enrichment.risk_signals) {
        items.push({
          id: `risk-${signal.label}`,
          title: `${signal.label} signal`,
          summary: signal.reason,
          tone: signal.severity === "critical" || signal.severity === "high" ? "failure" : "warning",
          details: [`Severity: ${signal.severity}`, signal.reason],
        });
      }
    } else if (request) {
      items.push({
        id: "risk-clear",
        title: "Risk scan",
        summary: "No elevated risk patterns detected in changed files.",
        tone: "success",
        details: ["The deterministic scan did not find auth, infra, database, or secrets-related hotspots."],
      });
    }

    const toneOrder = { failure: 0, warning: 1, success: 2, neutral: 3 };
    return items.sort((a, b) => toneOrder[a.tone] - toneOrder[b.tone]);
  }, [readiness, request]);

  function cancelHold() {
    if (holdFrameRef.current) {
      cancelAnimationFrame(holdFrameRef.current);
      holdFrameRef.current = null;
    }
    holdStartedAtRef.current = null;
    setHoldProgress(0);
  }

  function queueApproval() {
    navigator.vibrate?.(50);
    setDecisionState((current) => (current.status === "error" ? { status: "idle" } : current));
    setUndoExpiresAt(Date.now() + UNDO_DURATION_MS);
    setUndoCountdown(Math.ceil(UNDO_DURATION_MS / 1000));
  }

  function startHold() {
    if (!canReview || !isAuthenticated || decisionState.status === "submitting") return;
    if (!needsHoldToApprove) {
      queueApproval();
      return;
    }

    holdStartedAtRef.current = performance.now();

    const step = (now: number) => {
      const startedAt = holdStartedAtRef.current;
      if (startedAt == null) return;
      const progress = Math.min(1, (now - startedAt) / HOLD_DURATION_MS);
      setHoldProgress(progress);

      if (progress >= 1) {
        cancelHold();
        queueApproval();
        return;
      }

      holdFrameRef.current = requestAnimationFrame(step);
    };

    holdFrameRef.current = requestAnimationFrame(step);
  }

  function undoApproval() {
    setUndoExpiresAt(null);
    setUndoCountdown(0);
  }

  function redirectToLogin() {
    window.location.href = `/login?callbackUrl=${encodeURIComponent(`/review/${id}`)}`;
  }

  async function regenerateSummary() {
    setRegenerateState({ status: "submitting" });
    try {
      const response = await fetch(`/api/review/${id}/summary`, { method: "POST" });
      const body = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setRegenerateState({ status: "error", message: body.error ?? "Unable to regenerate summary." });
        return;
      }

      setRegenerateState({ status: "success", message: "Summary refreshed." });
      await loadRequest(true);
    } catch {
      setRegenerateState({ status: "error", message: "Network error while regenerating summary." });
    }
  }

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

  async function submitUpdateBranch() {
    setUpdateBranchState({ status: "updating" });
    try {
      const response = await fetch(`/api/review/${id}/update-branch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };
      if (!response.ok || !body.success) {
        setUpdateBranchState({ status: "error", message: body.message ?? "Unable to update branch." });
        return;
      }
      setUpdateBranchState({ status: "updated", message: "Branch updated. Waiting for checks..." });
      void loadRequest(true);
    } catch {
      setUpdateBranchState({ status: "error", message: "Network error while updating branch." });
    }
  }

  function renderPreMergeChecklist() {
    if (!showChecklist) return null;

    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Pre-merge checks</p>
        <div className="mt-3 space-y-3">
          <details className="rounded-xl border border-border bg-void/40 p-3" open={!checksPassing}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-signal">
              <span>{getCheckSummary(readiness)}</span>
              <ChevronDown className="h-4 w-4 text-muted" />
            </summary>
            <div className="mt-3 space-y-2 text-sm text-secondary">
              {readiness?.checks?.length ? (
                readiness.checks.map((check) => {
                  const passed = check.status === "completed" && check.conclusion === "success";
                  const pending = check.status !== "completed";
                  return (
                    <div key={check.name} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                      <span className="text-signal">{check.name}</span>
                      <span className={passed ? "text-permit" : pending ? "text-warning" : "text-danger"}>
                        {pending ? "Pending" : passed ? "Passing" : check.conclusion ?? "Failed"}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p>No checks reported.</p>
              )}
            </div>
          </details>

          <div className={`rounded-xl border px-4 py-3 text-sm ${hasConflict ? "border-danger/40 bg-danger/10 text-danger" : branchBehind ? "border-warning/40 bg-warning/10 text-warning" : "border-permit/40 bg-permit/10 text-permit"}`}>
            {hasConflict
              ? "Merge conflict detected on GitHub."
              : branchBehind
                ? `Branch is ${readiness?.behind_by ?? 0} commit${(readiness?.behind_by ?? 0) === 1 ? "" : "s"} behind ${request?.enrichment?.diff?.base_branch ?? "base"}.`
                : `Branch is up to date with ${request?.enrichment?.diff?.base_branch ?? "base"}.`}
          </div>
        </div>
      </div>
    );
  }

  function renderMergeAction() {
    if (request?.pr_merged) {
      return (
        <div className="rounded-2xl border border-permit/40 bg-permit/10 p-4">
          <p className="text-sm font-semibold text-permit">PR merged on GitHub</p>
          {request.pr_merge_sha ? <p className="mt-1 font-mono text-xs text-secondary">{request.pr_merge_sha.slice(0, 7)}</p> : null}
        </div>
      );
    }

    if (request?.status === "approved" && hasLinkedPr) {
      if (branchBehind) {
        return (
          <button
            type="button"
            disabled={updateBranchState.status === "updating"}
            onClick={() => void submitUpdateBranch()}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-warning bg-warning/10 px-4 py-3 text-sm font-semibold text-warning disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updateBranchState.status === "updating" ? "Updating branch..." : "Update branch"}
          </button>
        );
      }

      if (hasConflict && githubPrUrl) {
        return (
          <a
            href={githubPrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-signal hover:border-permit/40"
          >
            Resolve on GitHub
            <ExternalLink className="h-4 w-4" />
          </a>
        );
      }

      return (
        <button
          type="button"
          title={!canMergeNow ? mergeBlockedReason : undefined}
          disabled={!canMergeNow || mergeState.status === "merging"}
          onClick={() => void submitMerge()}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#3B82F6] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mergeState.status === "merging" ? "Merging..." : "Merge & deploy"}
        </button>
      );
    }

    if (request?.status === "approved") {
      return (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-secondary">
          No PR linked. Merge manually on GitHub.
        </div>
      );
    }

    return null;
  }

  return (
    <section className="min-h-screen bg-void px-4 pb-40 pt-4 sm:px-6 sm:pb-32">
      <div className="mx-auto max-w-3xl">
        <Link href="/review" className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm text-secondary transition-colors hover:text-permit">
          ← All Requests
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="sticky top-3 z-30 mb-4 rounded-3xl border border-border bg-card/95 p-4 shadow-[0_16px_36px_rgba(0,0,0,0.45)] backdrop-blur"
        >
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 w-24 rounded bg-ash" />
              <div className="h-6 w-40 rounded bg-ash" />
              <div className="h-4 w-48 rounded bg-ash" />
            </div>
          ) : request ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Requested by</p>
                  <p className="truncate text-lg font-semibold text-signal">{request.actor ?? request.requested_by ?? "Unknown requester"}</p>
                  <p className="mt-1 text-sm text-secondary">
                    {relativeTimestamp}
                    <span className="mx-1.5 text-muted">•</span>
                    {createdAt}
                  </p>
                </div>
                <span className={`inline-flex min-h-11 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-[0.14em] ${environmentPillClasses(environmentLabel)}`}>
                  {environmentLabel}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex min-h-11 items-center rounded-full border border-border px-3 text-xs font-medium text-secondary">
                  {request.github_pr?.owner && request.github_pr?.repo
                    ? `${request.github_pr.owner}/${request.github_pr.repo}`
                    : request.resource ?? "Unknown repository"}
                </span>
                <span className={`inline-flex min-h-11 items-center rounded-full border px-3 text-xs font-semibold uppercase ${riskPillClasses(request.risk_tier)}`}>
                  {request.risk_tier ?? "unknown"} risk
                </span>
                <span className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-xs font-semibold ${stateMeta.tone}`}>
                  <StateIcon className="h-4 w-4" />
                  {stateMeta.label}
                </span>
              </div>
            </div>
          ) : null}
        </motion.div>

        {showAuditTrailLink ? (
          <a
            href={`https://app.permissionprotocol.com/pp/deploy-requests/${request?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-flex min-h-11 items-center text-sm text-secondary transition-colors hover:text-permit"
          >
            View full audit trail on Permission Protocol →
          </a>
        ) : null}

        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.04 }}
          className="space-y-4 rounded-[28px] border border-border bg-ash p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:p-6"
        >
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-28 rounded-3xl bg-card" />
              <div className="h-24 rounded-3xl bg-card" />
              <div className="h-24 rounded-3xl bg-card" />
            </div>
          ) : null}

          {!loading && fetchError ? (
            <div className="rounded-3xl border border-danger/50 bg-danger/10 p-4 text-sm text-danger">{fetchError}</div>
          ) : null}

          {!loading && !fetchError && request ? (
            <>
              <section className="rounded-3xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">AI summary</p>
                    <h1 className="mt-2 text-xl font-semibold text-signal">
                      {request.github_pr?.title ?? request.action ?? "Deploy request"}
                    </h1>
                  </div>
                  {hasLinkedPr && githubPrUrl ? (
                    <a
                      href={githubPrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border px-3 text-xs font-medium text-secondary hover:border-permit/40 hover:text-signal"
                    >
                      PR #{request.github_pr?.pr_number}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>

                {isSummaryStale ? (
                  <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-warning">Summary is stale</p>
                        <p className="mt-1 text-sm text-secondary">
                          The PR head SHA changed after this assessment was generated.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={regenerateState.status === "submitting"}
                        onClick={() => void regenerateSummary()}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-warning px-4 text-sm font-semibold text-warning disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RefreshCw className={`h-4 w-4 ${regenerateState.status === "submitting" ? "animate-spin" : ""}`} />
                        {regenerateState.status === "submitting" ? "Regenerating..." : "Regenerate"}
                      </button>
                    </div>
                  </div>
                ) : null}

                <p className="mt-4 text-base leading-7 text-signal sm:text-lg">{summary}</p>
                {summaryGeneratedAt ? (
                  <p className="mt-2 text-xs text-muted">Generated {formatTimestamp(summaryGeneratedAt, { includeSeconds: false })}</p>
                ) : null}
                {regenerateState.status === "error" ? (
                  <p className="mt-2 text-sm text-danger">{regenerateState.message}</p>
                ) : null}
                {regenerateState.status === "success" && !isSummaryStale ? (
                  <p className="mt-2 text-sm text-permit">{regenerateState.message}</p>
                ) : null}

                <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className={`rounded-2xl border px-4 py-3 ${riskMeta.chip}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em]">Risk score</p>
                    <p className={`mt-1 text-lg font-semibold ${riskMeta.tone}`}>{riskMeta.label}</p>
                    <p className="mt-1 text-sm text-secondary">{riskMeta.rationale}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-void/40 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Blast radius</p>
                    <p className="mt-1 text-sm font-medium text-signal">{blastRadius}</p>
                    <p className="mt-1 text-sm text-secondary">Affected surfaces inferred from changed paths.</p>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Author track record</p>
                <p className="mt-2 text-base font-semibold text-signal">{authorTrustCopy}</p>
                {authorTrackRecord ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-border bg-void/40 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Recent deploys</p>
                      <p className="mt-1 text-sm font-medium text-signal">{authorTrackRecord.recent_deploys}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-void/40 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Total deploys</p>
                      <p className="mt-1 text-sm font-medium text-signal">{authorTrackRecord.total_deploys}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-void/40 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Approval speed</p>
                      <p className="mt-1 text-sm font-medium text-signal">
                        {authorTrackRecord.avg_approval_time_seconds != null
                          ? `${Math.round(authorTrackRecord.avg_approval_time_seconds / 60)}m avg`
                          : "N/A"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-void/40 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Current streak</p>
                      <p className="mt-1 text-sm font-medium text-signal">{authorTrackRecord.streak}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-secondary">Author history is not available yet.</p>
                )}
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Trust signals</p>
                    <p className="mt-1 text-sm text-secondary">Failures first. Expand any item for details.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {trustSignals.map((signal) => (
                    <details key={signal.id} className={`rounded-2xl border p-4 ${trustToneClasses(signal.tone)}`} open={signal.tone !== "success"}>
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{signal.title}</p>
                          <p className="mt-1 text-sm">{signal.summary}</p>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      </summary>
                      <div className="mt-3 space-y-2 border-t border-current/15 pt-3 text-sm">
                        {signal.details.map((detail, index) => (
                          <p key={`${signal.id}-${index}`}>{detail}</p>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </section>

              {isStaleRequest ? (
                <div className="rounded-3xl border border-warning/50 bg-warning/10 p-4">
                  <p className="text-sm font-semibold text-warning">This review request is stale</p>
                  <p className="mt-1 text-sm text-secondary">
                    The linked PR was already {request?.pr_merged ? "merged" : "closed"} on GitHub, so approve and reject actions are disabled.
                  </p>
                </div>
              ) : null}

              {decisionState.status === "approved" ? (
                <div className="rounded-3xl border border-permit/50 bg-permit/10 p-4">
                  <p className="text-sm font-semibold text-permit">Request approved</p>
                  {decisionState.receiptId ? (
                    <Link className="mt-1 inline-block text-sm font-semibold text-permit hover:underline" href={`/r/${decisionState.receiptId}`}>
                      Receipt: {decisionState.receiptId.slice(0, 24)}…
                    </Link>
                  ) : (
                    <p className="mt-1 text-sm text-secondary">Receipt generated.</p>
                  )}
                  {decisionState.rerunResult?.ok ? (
                    <p className="mt-2 text-sm text-permit">✅ Deploy Gate re-triggered ({decisionState.rerunResult.strategy === "check_run" ? "check re-run" : "workflow re-run"})</p>
                  ) : decisionState.rerunResult && !decisionState.rerunResult.ok ? (
                    <p className="mt-2 text-sm text-warning">⚠️ Could not auto-rerun Deploy Gate: {decisionState.rerunResult.error ?? "unknown error"}. You may need to re-run it manually on GitHub.</p>
                  ) : null}
                </div>
              ) : null}

              {decisionState.status === "rejected" ? (
                <div className="rounded-3xl border border-danger/50 bg-danger/10 p-4 text-sm font-semibold text-danger">
                  Request rejected and blocked.
                </div>
              ) : null}

              {decisionState.status === "error" ? (
                <div className="rounded-3xl border border-danger/50 bg-danger/10 p-4 text-sm font-semibold text-danger">
                  {decisionState.message}
                </div>
              ) : null}

              {renderPreMergeChecklist()}
              {mergeState.status === "idle" ? renderMergeAction() : null}
              {mergeState.status === "merging" ? (
                <div className="rounded-3xl border border-[#3B82F6]/50 bg-[#3B82F6]/10 p-4 text-sm font-semibold text-[#3B82F6]">
                  Merging...
                </div>
              ) : null}
              {mergeState.status === "merged" ? (
                <div className="rounded-3xl border border-permit/50 bg-permit/10 p-4 text-sm font-semibold text-permit">
                  PR merged on GitHub
                </div>
              ) : null}
              {mergeState.status === "error" ? (
                <div className="space-y-3">
                  <div className="rounded-3xl border border-danger/50 bg-danger/10 p-4">
                    <p className="text-sm font-semibold text-danger">Merge failed</p>
                    <p className="mt-1 text-sm text-secondary">{mergeState.message}</p>
                  </div>
                  <button
                    onClick={() => {
                      setMergeState({ status: "idle" });
                      void submitMerge();
                    }}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#3B82F6] px-4 py-3 text-sm font-semibold text-white"
                  >
                    Retry merge
                  </button>
                </div>
              ) : null}
              {updateBranchState.status === "updated" ? (
                <div className="rounded-3xl border border-permit/40 bg-permit/10 p-4 text-sm font-semibold text-permit">
                  {updateBranchState.message}
                </div>
              ) : null}
              {updateBranchState.status === "error" ? (
                <div className="rounded-3xl border border-danger/40 bg-danger/10 p-4 text-sm font-semibold text-danger">
                  {updateBranchState.message}
                </div>
              ) : null}

              <section className="rounded-3xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Decision note</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {reasonPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReason(preset)}
                      className={`inline-flex min-h-11 items-center rounded-full border px-4 text-xs font-medium ${
                        reason === preset
                          ? "border-permit bg-permit/10 text-permit"
                          : "border-border bg-void/50 text-secondary hover:border-permit/40 hover:text-signal"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  placeholder="Optional note included with the decision."
                  className="mt-3 w-full rounded-2xl border border-border bg-void/50 px-4 py-3 text-sm text-signal placeholder:text-secondary/70 focus:border-permit focus:outline-none"
                />
              </section>

              <RequestTimeline items={timelineItems} defaultOpen={timelineExpanded} />

              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {metadataItems(request).map((item) => (
                  <div key={item.label} className="rounded-3xl border border-border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{item.label}</p>
                    <p className="mt-2 break-words text-sm font-medium text-signal">{item.value}</p>
                  </div>
                ))}
              </section>

              <div className="rounded-3xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Timestamp</p>
                <p className="mt-2 text-sm text-secondary">{formatTimestamp(request.timestamp ?? request.created_at)}</p>
              </div>

              {request.enrichment?.diff ? (
                <details className="rounded-3xl border border-border bg-card p-4" open={isPending}>
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-signal">
                    <span className="inline-flex items-center gap-2">
                      <FileCode2 className="h-4 w-4 text-permit" />
                      {request.enrichment.diff.total_files} files changed
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted" />
                  </summary>
                  <div className="mt-4 space-y-2">
                    {request.enrichment.diff.files.map((file) => (
                      <div key={file.filename} className="rounded-2xl border border-border bg-void/40 p-3">
                        <p className="break-all font-mono text-xs text-secondary">{file.filename}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          {file.additions > 0 ? <span className="text-permit">+{file.additions}</span> : null}
                          {file.deletions > 0 ? <span className="text-danger">-{file.deletions}</span> : null}
                          <span className="rounded-full border border-border px-2 py-1 text-secondary">{file.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    {request.enrichment.diff.head_branch} → {request.enrichment.diff.base_branch}
                  </p>
                </details>
              ) : request.github_pr ? (
                <details className="rounded-3xl border border-border bg-card p-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-signal">
                    <span className="inline-flex items-center gap-2">
                      <GitPullRequest className="h-4 w-4 text-permit" />
                      GitHub PR context
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted" />
                  </summary>
                  <p className="mt-3 text-sm text-signal">{request.github_pr.title ?? "Untitled PR"}</p>
                </details>
              ) : null}

              {request.preview_url ? (
                <details className="rounded-3xl border border-permit/30 bg-card p-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-signal">
                    <span className="inline-flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-permit" />
                      Live preview
                    </span>
                    <a
                      href={request.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="text-xs text-permit hover:underline"
                    >
                      Open ↗
                    </a>
                  </summary>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                    <iframe
                      src={request.preview_url}
                      title="Vercel Preview"
                      className="h-[360px] w-full bg-white"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </details>
              ) : null}

              {request.status === "superseded" && request.supersededByRequestId ? (
                <div className="rounded-3xl border border-warning/40 bg-warning/10 p-4">
                  <p className="text-sm font-semibold text-warning">This request was superseded by a newer version.</p>
                  <Link
                    href={`/review/${request.supersededByRequestId}`}
                    className="mt-3 inline-flex min-h-11 items-center rounded-2xl border border-warning px-4 text-sm font-semibold text-warning"
                  >
                    View latest request
                  </Link>
                </div>
              ) : null}
            </>
          ) : null}
        </motion.article>
      </div>

      {showRejectSheet ? (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowRejectSheet(false)}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-[28px] border border-border bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-16px_40px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-signal">Reject request</p>
                <p className="mt-1 text-sm text-secondary">Choose a reason or add your own note.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectSheet(false)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border text-secondary"
              >
                <CircleX className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {rejectReasonPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm ${
                    reason === preset
                      ? "border-danger bg-danger/10 text-danger"
                      : "border-border bg-void/40 text-secondary"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder="Why should this not go live?"
              className="mt-4 w-full rounded-2xl border border-border bg-void/50 px-4 py-3 text-sm text-signal placeholder:text-secondary/70 focus:border-danger focus:outline-none"
            />

            <button
              type="button"
              disabled={!canReview || decisionState.status === "submitting"}
              onClick={() => {
                if (!isAuthenticated) {
                  redirectToLogin();
                  return;
                }
                void submitDecision("reject");
              }}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-danger bg-danger/10 px-4 py-3 text-sm font-semibold text-danger disabled:cursor-not-allowed disabled:opacity-60"
            >
              {decisionState.status === "submitting" && decisionState.action === "reject" ? "Rejecting..." : "Confirm reject"}
            </button>
          </div>
        </div>
      ) : null}

      {showReviewActions ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
          <div className="mx-auto max-w-3xl px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 sm:px-6">
            {undoExpiresAt ? (
              <div className="rounded-3xl border border-permit/40 bg-permit/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-permit">Approval queued</p>
                    <p className="mt-1 text-sm text-secondary">Undo within {undoCountdown}s before it is submitted.</p>
                  </div>
                  <button
                    type="button"
                    onClick={undoApproval}
                    className="inline-flex min-h-11 items-center rounded-full border border-permit px-4 text-sm font-semibold text-permit"
                  >
                    Undo
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {isStaleRequest ? (
                  <div className="rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
                    Review actions are disabled because the linked PR is no longer open.
                  </div>
                ) : null}
                {isStaleRequest ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#10B981] px-4 py-4 text-base font-semibold text-void opacity-50"
                  >
                    Approve
                  </button>
                ) : isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-void/40 px-4 py-3">
                      {approverAvatar ? (
                        <span
                          aria-hidden="true"
                          className="h-9 w-9 rounded-full border border-border bg-cover bg-center"
                          style={{ backgroundImage: `url(${approverAvatar})` }}
                        />
                      ) : (
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-signal">
                          {(approverUsername ?? "?").slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <p className="text-sm font-medium text-signal">
                        Approving as <span className="text-permit">@{approverUsername ?? "unknown"}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!canReview || decisionState.status === "submitting"}
                      onClick={needsHoldToApprove ? undefined : () => queueApproval()}
                      onPointerDown={needsHoldToApprove ? startHold : undefined}
                      onPointerUp={needsHoldToApprove ? cancelHold : undefined}
                      onPointerLeave={needsHoldToApprove ? cancelHold : undefined}
                      onPointerCancel={needsHoldToApprove ? cancelHold : undefined}
                      className="relative inline-flex min-h-11 w-full touch-none items-center justify-center overflow-hidden rounded-2xl bg-[#10B981] px-4 py-4 text-base font-semibold text-void disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {needsHoldToApprove && holdProgress > 0 ? (
                        <span
                          className="absolute inset-y-0 left-0 bg-white/20"
                          style={{ width: `${holdProgress * 100}%` }}
                        />
                      ) : null}
                      <span className="relative inline-flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        {decisionState.status === "submitting" && decisionState.action === "approve"
                          ? "Approving..."
                          : needsHoldToApprove
                            ? holdProgress > 0
                              ? "Keep holding..."
                              : "Hold to approve"
                            : "Approve"}
                      </span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={redirectToLogin}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-permit bg-permit/10 px-4 py-4 text-base font-semibold text-permit"
                  >
                    Sign in with GitHub to approve
                  </button>
                )}

                <button
                  type="button"
                  disabled={!canReview || decisionState.status === "submitting"}
                  onClick={() => {
                    if (!isAuthenticated) {
                      redirectToLogin();
                      return;
                    }
                    setShowRejectSheet(true);
                  }}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-danger bg-danger/10 px-4 py-3 text-sm font-semibold text-danger disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CircleX className="mr-2 h-4 w-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
