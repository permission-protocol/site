"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock, GitPullRequest, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

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

function riskBadge(tier: string) {
  switch (tier) {
    case "high":
      return "border-danger/50 bg-danger/10 text-danger";
    case "medium":
      return "border-warning/50 bg-warning/10 text-warning";
    default:
      return "border-[#10B981]/50 bg-[#10B981]/10 text-[#10B981]";
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

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/review/list", { cache: "no-store" });
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

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
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
          <p className="mt-1 text-sm text-secondary">No pending requests. You're up to date.</p>
        </div>
      ) : (
        <div className="space-y-6">
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
        className="group block rounded-xl border border-border bg-card p-4 transition-all hover:border-permit/40 hover:bg-card/80"
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
                <span>{timeAgo(r.created_at)}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${riskBadge(r.risk_tier)}`}>
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
