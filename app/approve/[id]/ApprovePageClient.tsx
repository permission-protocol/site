"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleX, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { demoReceipt } from "@/src/lib/artifactDemo";

type ApprovePageClientProps = {
  id: string;
};

export function ApprovePageClient({ id }: ApprovePageClientProps) {
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [draftDecision, setDraftDecision] = useState<"approve" | "reject" | null>(null);
  const [showRejectNote, setShowRejectNote] = useState(false);
  const risk = useMemo(() => (id.toLowerCase().includes("high") ? "High" : "Standard"), [id]);

  async function confirmDecision(nextDecision: "approve" | "reject") {
    setDraftDecision(nextDecision);
    await new Promise((resolve) => setTimeout(resolve, 450));
    setDecision(nextDecision);
    setDraftDecision(null);
  }

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
              rows={showRejectNote ? 3 : 4}
              className="mt-2 w-full rounded-xl border border-border bg-[#111] px-3 py-2.5 text-sm text-signal placeholder:text-muted"
            />

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <motion.button
                onClick={() => void confirmDecision("approve")}
                disabled={draftDecision !== null}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#10B981] px-4 py-3 font-semibold text-void hover:brightness-110"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={draftDecision === "approve" ? "approve-loading" : "approve-idle"}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center gap-2"
                  >
                    {draftDecision === "approve" ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </>
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
              <button
                onClick={() => setShowRejectNote((current) => !current)}
                disabled={draftDecision !== null}
                className="inline-flex w-full items-center justify-center rounded-xl border border-danger bg-danger/10 px-4 py-3 font-semibold text-signal hover:bg-danger/20"
              >
                <CircleX className="mr-2 h-4 w-4" />
                {showRejectNote ? "Hide reject note" : "Reject"}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {showRejectNote ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-xl border border-danger/40 bg-danger/10 p-3">
                    <label className="block text-sm text-secondary" htmlFor="reject-comment">
                      Reject reason
                    </label>
                    <textarea
                      id="reject-comment"
                      placeholder="Why should this be blocked?"
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-xl border border-border bg-[#111] px-3 py-2.5 text-sm text-signal placeholder:text-muted"
                    />
                    <motion.button
                      onClick={() => void confirmDecision("reject")}
                      disabled={draftDecision !== null}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-danger bg-danger/10 px-4 py-3 font-semibold text-danger"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={draftDecision === "reject" ? "reject-loading" : "reject-idle"}
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="inline-flex items-center gap-2"
                        >
                          {draftDecision === "reject" ? (
                            <>
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <CircleX className="h-4 w-4" />
                              Confirm reject
                            </>
                          )}
                        </motion.span>
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </>
        ) : decision === "approve" ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: [0.96, 1.02, 1] }} transition={{ duration: 0.3 }}>
            <p className="inline-flex items-center gap-2 text-2xl font-bold text-[#10B981]">
              <CheckCircle2 className="h-6 w-6" />
              Approved
            </p>
            <p className="mt-2 text-sm text-secondary">Receipt issued: pp_r_8f91c2</p>
            {comment ? <p className="mt-2 text-sm text-secondary">Comment saved: &quot;{comment}&quot;</p> : null}
            <Link href={`/r/${id}`} className="mt-5 inline-block text-sm font-semibold text-permit hover:text-[#6ac9b7]">
              View Receipt →
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <p className="inline-flex items-center gap-2 text-2xl font-bold text-danger">
              <CircleX className="h-6 w-6" />
              Rejected
            </p>
            <p className="mt-2 text-sm text-secondary">Action blocked. No receipt issued.</p>
            {comment ? <p className="mt-2 text-sm text-secondary">Comment saved: &quot;{comment}&quot;</p> : null}
          </motion.div>
        )}
      </motion.div>

      <p className="mt-6 text-center text-sm text-secondary">Powered by Permission Protocol</p>
    </section>
  );
}
