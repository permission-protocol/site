"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, X } from "lucide-react";
import { replayAuthorizedEvents, replayBlockedEvents } from "@/src/lib/artifactDemo";

type ReplayPageClientProps = {
  id: string;
};

export function ReplayPageClient({ id }: ReplayPageClientProps) {
  const isBlocked = id.toLowerCase().includes("blocked");
  const events = isBlocked ? replayBlockedEvents : replayAuthorizedEvents;

  return (
    <section className="min-h-screen bg-void px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mx-auto w-full max-w-[600px]"
      >
        <h1 className="text-3xl font-bold text-signal">AI Action Replay</h1>
        <p
          className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
            isBlocked
              ? "border-danger/50 bg-danger/15 text-danger"
              : "border-[#10B981]/50 bg-[#10B981]/15 text-[#10B981]"
          }`}
        >
          {isBlocked ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          {isBlocked ? "BLOCKED" : "AUTHORIZED"}
        </p>

        <div className="relative mt-8 pl-24 sm:pl-28">
          <div className="absolute bottom-8 left-[5.25rem] top-2 w-[2px] bg-[#222] sm:left-[6.25rem]" />

          {events.map((event, index) => {
            const isFinal = "final" in event && event.final;
            const isBlockedTerminal = "blocked" in event && event.blocked;

            const dotClass =
              event.tone === "green"
                ? "bg-[#10B981]"
                : event.tone === "amber"
                  ? "bg-warning"
                  : event.tone === "red"
                    ? "bg-danger"
                    : "bg-permit";

            return (
              <motion.article
                key={`${event.timestamp}-${event.title}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05, ease: "easeOut" }}
                className="relative mb-8"
              >
                <p className="absolute -left-24 top-0 font-mono text-xs text-muted sm:-left-28">{event.timestamp}</p>

                {isBlockedTerminal ? (
                  <div className="absolute -left-[30px] top-0 flex h-10 w-10 items-center justify-center rounded-full border border-danger/60 bg-danger/20 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-[pulse_2s_ease-in-out_infinite]">
                    <X className="h-6 w-6 text-danger" />
                  </div>
                ) : (
                  <span
                    className={`absolute -left-[17px] top-1 block rounded-full ${dotClass} ${
                      isFinal
                        ? "h-5 w-5 shadow-[0_0_18px_rgba(16,185,129,0.65)]"
                        : "h-3 w-3"
                    }`}
                  />
                )}

                <h2 className={`${isBlockedTerminal ? "text-2xl font-bold text-danger" : "text-base font-semibold text-signal"}`}>
                  {isBlockedTerminal ? "ACTION BLOCKED" : event.title}
                </h2>
                <p className="mt-1 text-sm text-signal/95">{event.detail}</p>
                {event.subDetail ? <p className="mt-1 text-sm text-secondary">{event.subDetail}</p> : null}
                {!isBlocked && isFinal ? <p className="mt-1 text-sm text-[#10B981]">✓</p> : null}
              </motion.article>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-ash/80 p-5">
          <p className="text-sm font-semibold text-signal">Artifacts</p>
          <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:gap-6">
            <Link href={`/r/${id}`} className="text-permit hover:text-[#6ac9b7]">
              View Receipt →
            </Link>
            <Link href={`/approve/${id}`} className="text-permit hover:text-[#6ac9b7]">
              View Approval →
            </Link>
          </div>
        </div>

        <footer className="mt-8 text-center">
          <p className="text-sm text-secondary">Protected by Permission Protocol</p>
          <Link href="/developers/quickstart" className="mt-1 inline-block text-sm font-semibold text-permit hover:text-[#6ac9b7]">
            Get Started Free →
          </Link>
        </footer>
      </motion.div>
    </section>
  );
}
