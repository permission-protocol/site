"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { demoReceipt } from "@/src/lib/artifactDemo";

type ApprovePageClientProps = {
  id: string;
};

export function ApprovePageClient({ id }: ApprovePageClientProps) {
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const risk = useMemo(() => (id.toLowerCase().includes("high") ? "High" : "Standard"), [id]);

  return (
    <section className="min-h-screen bg-void px-4 py-10 sm:px-6 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mx-auto w-full max-w-[480px] rounded-[28px] border border-border bg-ash p-7 shadow-[0_20px_60px_rgba(0,0,0,0.5)] sm:p-8"
      >
        {decision === null ? (
          <>
            <p className="inline-flex rounded-full border border-warning/60 bg-warning/15 px-4 py-2 text-sm font-bold text-warning">
              ⚡ APPROVAL REQUIRED
            </p>

            <div className="mt-6 space-y-2">
              <h1 className="text-3xl font-bold text-signal">{demoReceipt.action}</h1>
              <p className="text-sm text-secondary">Resource: {demoReceipt.resource}</p>
              <p className="text-sm text-secondary">Agent: {demoReceipt.actor}</p>
              <p className={`text-sm ${risk === "High" ? "font-semibold text-danger" : "text-secondary"}`}>
                Risk Level: {risk}
              </p>
              <p className="text-sm text-secondary">Requested: 2026-03-03 10:14:22 UTC</p>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-sm text-secondary">
                Release window approved by product leadership. Deploy unblocks billing migration and fixes delayed invoice generation for EMEA.
              </p>
            </div>

            <label className="mt-6 block text-sm text-secondary" htmlFor="approval-comment">
              Comment
            </label>
            <textarea
              id="approval-comment"
              placeholder="Add a note (optional)"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-border bg-[#111] px-3 py-2.5 text-sm text-signal placeholder:text-muted"
            />

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => setDecision("approve")}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#10B981] px-4 py-3 font-semibold text-void hover:brightness-110"
              >
                Approve
              </button>
              <button
                onClick={() => setDecision("reject")}
                className="inline-flex w-full items-center justify-center rounded-xl border border-danger bg-danger/10 px-4 py-3 font-semibold text-signal hover:bg-danger/20"
              >
                Reject
              </button>
            </div>
          </>
        ) : decision === "approve" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <p className="text-2xl font-bold text-[#10B981]">✓ Approved</p>
            <p className="mt-2 text-sm text-secondary">Receipt issued: pp_r_8f91c2</p>
            {comment ? <p className="mt-2 text-sm text-secondary">Comment saved: &quot;{comment}&quot;</p> : null}
            <Link href={`/r/${id}`} className="mt-5 inline-block text-sm font-semibold text-permit hover:text-[#6ac9b7]">
              View Receipt →
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <p className="text-2xl font-bold text-danger">✕ Rejected</p>
            <p className="mt-2 text-sm text-secondary">Action blocked. No receipt issued.</p>
            {comment ? <p className="mt-2 text-sm text-secondary">Comment saved: &quot;{comment}&quot;</p> : null}
          </motion.div>
        )}
      </motion.div>

      <p className="mt-6 text-center text-sm text-secondary">Powered by Permission Protocol</p>
    </section>
  );
}
