"use client";

import { motion } from "framer-motion";
import { Bot, CheckCheck, FileCheck2, ShieldCheck } from "lucide-react";

const nodeBase =
  "mx-auto flex h-20 w-64 items-center justify-center rounded-2xl border text-base font-semibold";

export function DiagramFlow() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
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
        className="relative mx-auto h-16 w-0.5 bg-border"
      >
        <span className="absolute -left-2 top-2 h-4 w-4 rounded-full border border-permit/60 bg-permit/30" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className={`${nodeBase} animate-pulseSoft border-permit/60 bg-permit/10 text-signal shadow-glow`}
      >
        <ShieldCheck className="mr-2 h-5 w-5 text-permit" /> Permission Protocol
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.3 }}
        className="relative mx-auto h-16 w-0.5 bg-border"
      >
        <span className="absolute -left-2 top-2 h-4 w-4 rounded-full border border-permit/60 bg-permit/30" />
        <span className="absolute -left-20 top-5 inline-flex items-center rounded-md border border-permit/40 bg-ash px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-permit">
          <FileCheck2 className="mr-1 h-3 w-3" />
          Receipt
        </span>
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
