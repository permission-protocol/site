"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Lock, ShieldCheck } from "lucide-react";
import { ReceiptShareButtons } from "@/src/components/ReceiptShareButtons";

type ReceiptPageClientProps = {
  id: string;
};

type ReceiptViewData = {
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
};

function formatTimestamp(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

function abbreviateSha(value: string | null) {
  return value ? value.slice(0, 7) : null;
}

function JsonCodeBlock({ value }: { value: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-void p-3 font-mono text-xs leading-5">
      <code>
        {value
          .replace(/"([^"]+)":/g, '"§$1§":')
          .split("§")
          .map((part, index) => {
            if (index % 2 === 1) {
              return (
                <span key={`${part}-${index}`} className="text-permit">
                  {part}
                </span>
              );
            }
            return part.split(/("[^"]*"\s*[\],}]?)/g).map((chunk, subIndex) => {
              if (/^"[^"]*"\s*[\],}]?$/.test(chunk)) {
                return (
                  <span key={`${chunk}-${subIndex}`} className="text-[#10B981]">
                    {chunk}
                  </span>
                );
              }
              return (
                <span key={`${chunk}-${subIndex}`} className="text-muted">
                  {chunk}
                </span>
              );
            });
          })}
      </code>
    </pre>
  );
}

function DetailRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number | null;
  href?: string | null;
}) {
  if (value === null || value === "") return null;

  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm text-signal">
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="font-medium text-permit hover:text-[#6ac9b7]">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function TimelineRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | null;
  detail?: string | null;
}) {
  if (!value) return null;

  return (
    <div className="rounded-2xl border border-border bg-[#111] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">{label}</p>
      <p className="mt-1 text-sm font-medium text-signal">{formatTimestamp(value) ?? value}</p>
      {detail ? <p className="mt-1 text-sm text-secondary">{detail}</p> : null}
    </div>
  );
}

export function ReceiptPageClient({ id }: ReceiptPageClientProps) {
  const [receipt, setReceipt] = useState<ReceiptViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadReceipt() {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const response = await fetch(`/api/r/${encodeURIComponent(id)}`, { cache: "no-store" });
        const data = (await response.json().catch(() => ({}))) as Partial<ReceiptViewData> & { error?: string };

        if (cancelled) return;

        if (response.status === 404) {
          setNotFound(true);
          setReceipt(null);
          return;
        }

        if (!response.ok) {
          setError(data.error ?? "Unable to load receipt.");
          setReceipt(null);
          return;
        }

        setReceipt(data as ReceiptViewData);
      } catch {
        if (!cancelled) {
          setError("Unable to load receipt.");
          setReceipt(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReceipt();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <section className="min-h-screen bg-void px-4 py-10 sm:px-6 md:py-14">
        <div className="mx-auto flex w-full max-w-[520px] flex-col items-center">
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full rounded-[28px] border border-[#222] bg-ash p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:p-10"
          >
            <div className="inline-flex items-center rounded-full border border-border px-4 py-2 text-base font-bold text-secondary">
              Loading receipt...
            </div>
            <div className="mt-7 h-8 w-3/4 rounded-full bg-[#151515]" />
            <div className="mt-6 space-y-3">
              <div className="h-12 rounded-2xl bg-[#111]" />
              <div className="h-12 rounded-2xl bg-[#111]" />
              <div className="h-12 rounded-2xl bg-[#111]" />
            </div>
          </motion.article>
        </div>
      </section>
    );
  }

  if (notFound || !receipt) {
    if (error && !notFound) {
      return (
        <section className="min-h-screen bg-void px-4 py-10 sm:px-6 md:py-14">
          <div className="mx-auto flex w-full max-w-[520px] flex-col items-center">
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full rounded-[28px] border border-[#222] bg-ash p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:p-10"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-danger/40 bg-danger/20 px-4 py-2 text-base font-bold text-danger">
                <AlertCircle className="h-4 w-4" /> Unable to load receipt
              </div>
              <h1 className="mt-7 text-2xl font-bold text-signal">Receipt lookup failed</h1>
              <p className="mt-3 text-sm text-secondary">{error}</p>
            </motion.article>
          </div>
        </section>
      );
    }

    return (
      <section className="min-h-screen bg-void px-4 py-10 sm:px-6 md:py-14">
        <div className="mx-auto flex w-full max-w-[520px] flex-col items-center">
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full rounded-[28px] border border-[#222] bg-ash p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:p-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-danger/40 bg-danger/20 px-4 py-2 text-base font-bold text-danger">
              <AlertCircle className="h-4 w-4" /> Receipt not found
            </div>
            <h1 className="mt-7 text-2xl font-bold text-signal">No receipt found for {id}</h1>
            <p className="mt-3 text-sm text-secondary">
              The PP API did not return a receipt or matching deploy request for this ID.
            </p>
          </motion.article>
        </div>
      </section>
    );
  }

  const isAuthorized = receipt.signature_verified !== false && receipt.status !== "denied";
  const state = isAuthorized ? "ACTION AUTHORIZED" : "SIGNATURE NOT VERIFIED";
  const technicalJson = JSON.stringify(receipt.technical_json, null, 2);
  const statusClass = isAuthorized
    ? "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40"
    : "bg-danger/20 text-danger border-danger/40";
  const statusGlyph = isAuthorized ? "✓" : "✕";
  const actionLabel = receipt.action_label ?? receipt.action ?? receipt.repo ?? `Receipt ${receipt.id}`;
  const signatureLabel =
    receipt.signature_status === "verified"
      ? "Verified"
      : receipt.signature_status === "not_verified"
        ? "Not verified"
        : "Unknown";

  return (
    <section className="min-h-screen bg-void px-4 py-10 sm:px-6 md:py-14">
      <div className="mx-auto flex w-full max-w-[520px] flex-col items-center">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full rounded-[28px] border border-[#222] bg-ash p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:p-10"
        >
          <div className={`inline-flex items-center rounded-full border px-4 py-2 text-base font-bold ${statusClass}`}>
            {statusGlyph} {state}
          </div>

          <div className="mt-7 border-b border-border pb-6">
            <h1 className="text-2xl font-bold text-signal">{actionLabel}</h1>
          </div>

          <dl className="mt-4 divide-y divide-border/70">
            <DetailRow label="Action" value={receipt.action_label ?? receipt.action} />
            <DetailRow label="Repo" value={receipt.repo} href={receipt.repo ? `https://github.com/${receipt.repo}` : null} />
            <DetailRow
              label="PR"
              value={receipt.pr_number ? `#${receipt.pr_number}` : null}
              href={receipt.pr_url}
            />
            <DetailRow
              label="Commit SHA"
              value={abbreviateSha(receipt.commit_sha)}
              href={receipt.commit_url}
            />
            <DetailRow label="Approved by" value={receipt.approved_by} href={receipt.approved_by_url} />
            <DetailRow label="Requested by" value={receipt.actor} />
            <DetailRow label="Policy" value={receipt.policy} />
            <DetailRow label="Timestamp" value={formatTimestamp(receipt.timestamp)} />
          </dl>

          <div className="mt-6 border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <p className="inline-flex items-center gap-2 text-base font-semibold text-[#10B981]">
                <ShieldCheck className="h-4 w-4" /> Signature: {signatureLabel}
              </p>
              <Lock className="h-4 w-4 text-[#10B981]/70" />
            </div>
            <p className="mt-2 text-sm text-permit">Issuer: Permission Protocol</p>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-[#0f0f0f] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Action Timeline</p>
            <div className="mt-3 space-y-3">
              <TimelineRow label="Request Created" value={receipt.created_at} />
              <TimelineRow
                label="Approved"
                value={receipt.approved_at}
                detail={receipt.approved_by ? `Approved by @${receipt.approved_by}` : null}
              />
              <TimelineRow label="Merge Unblocked" value={receipt.merge_unblocked_at} />
              {!receipt.created_at && !receipt.approved_at && !receipt.merge_unblocked_at ? (
                <p className="text-sm text-secondary">Timeline data is unavailable for this receipt.</p>
              ) : null}
            </div>
          </div>

          <details className="mt-6 rounded-xl border border-border bg-[#111] px-4 py-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-signal">
              Technical Details ▾
            </summary>
            <div className="mt-3 space-y-1.5 text-sm text-secondary">
              <p>Receipt ID: {receipt.id}</p>
              {receipt.request_id ? <p>Deploy Request ID: {receipt.request_id}</p> : null}
              {receipt.signature ? <p>Signature: {receipt.signature.slice(0, 20)}...</p> : null}
            </div>
            <JsonCodeBlock value={technicalJson} />
          </details>
        </motion.article>

        <ReceiptShareButtons receiptId={receipt.id} receiptJson={technicalJson} />

        <footer className="mt-9 text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-secondary">Permission Protocol</p>
          <p className="mt-1 text-sm text-secondary">Powered by Permission Protocol</p>
          <Link href="/developers/quickstart" className="mt-2 inline-block text-sm font-semibold text-permit hover:text-[#6ac9b7]">
            Add to your pipeline →
          </Link>
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        </footer>
      </div>
    </section>
  );
}
