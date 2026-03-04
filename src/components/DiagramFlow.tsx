"use client";

import { motion } from "framer-motion";
import { Bot, CheckCheck, FileCheck2, ShieldCheck } from "lucide-react";

const nodeBase =
  "mx-auto flex h-24 w-80 items-center justify-center rounded-2xl border text-lg font-semibold";

export function DiagramFlow() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className={`${nodeBase} border-border bg-card text-signal`}
      >
        <Bot className="mr-2 h-5 w-5 text-secondary" /> AI Agent
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className="relative mx-auto h-20 w-0.5 bg-permit/70"
      >
        <span className="absolute -left-2 top-4 h-4 w-4 rounded-full border border-permit/60 bg-permit/30" />
        <span className="absolute -left-[5px] bottom-2 h-0 w-0 border-x-[5px] border-t-[8px] border-x-transparent border-t-permit/80" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className={`relative ${nodeBase} border-permit/70 bg-[#0f1f1c] text-signal shadow-[0_0_0_1px_rgba(68,170,153,0.5),0_0_50px_rgba(68,170,153,0.4)]`}
      >
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-[-16px] -z-10 rounded-[24px]"
          style={{ background: "radial-gradient(circle, rgba(68,170,153,0.35) 0%, rgba(68,170,153,0.08) 55%, transparent 72%)" }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
        />
        <ShieldCheck className="mr-2 h-5 w-5 text-permit" /> Permission Protocol
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.3 }}
        className="relative mx-auto h-20 w-0.5 bg-permit/70"
      >
        <span className="absolute -left-2 top-4 h-4 w-4 rounded-full border border-permit/60 bg-permit/30" />
        <span className="absolute -left-[5px] bottom-2 h-0 w-0 border-x-[5px] border-t-[8px] border-x-transparent border-t-permit/80" />
        <span className="absolute -left-24 top-6 inline-flex items-center rounded-md border border-permit/40 bg-ash px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-permit">
          <FileCheck2 className="mr-1 h-3 w-3" />
          Receipt
        </span>
        <motion.span
          aria-hidden
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 58, opacity: [0, 1, 1, 0] }}
          transition={{ delay: 1.05, duration: 1.3, ease: "easeInOut" }}
          className="absolute -left-3 top-0 rounded-md border border-permit/60 bg-ash p-1 text-permit"
        >
          <FileCheck2 className="h-3.5 w-3.5" />
        </motion.span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.45 }}
        className={`${nodeBase} border-border bg-card text-signal`}
      >
        <CheckCheck className="mr-2 h-5 w-5 text-permit" /> Authorized Action
      </motion.div>
    </div>
  );
}
