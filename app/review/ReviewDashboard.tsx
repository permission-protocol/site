"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock, GitPullRequest, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

export function ReviewDashboard() {
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repoFilter, setRepoFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  return (
    <section className="mx-auto max-w-3xl px-4 pt-24 pb-12">
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-permit" />
        <div>
          <h1 className="text-2xl font-bold text-signal">Review Queue</h1>
          <p className="text-sm text-secondary">Deploy requests awaiting your decision.</p>
        </div>
      </div>

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
          </div>

          {pending.length > 0 ? (
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
          <div className="flex items-start gap-3 min-w-0">
            {statusIcon(r.status)}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-signal group-hover:text-permit transition-colors">
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
