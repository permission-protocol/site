"use client";

import { motion } from "framer-motion";

const rows = [
  ["Identity", "OAuth / Okta", "Who is making the request"],
  ["Encryption", "TLS", "Communication can be trusted"],
  ["Payments", "Stripe", "Money can move securely"],
  ["Observability", "Datadog", "What happened in the system"],
  ["Authority", "Permission Protocol", "Who authorized the action"]
];

export function ComparisonTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="grid grid-cols-3 bg-card px-5 py-3 text-xs uppercase tracking-[0.15em] text-secondary">
        <p>Layer</p>
        <p>System</p>
        <p>What It Proves</p>
      </div>
      {rows.map((row, index) => {
        const isPP = index === rows.length - 1;
        return (
          <motion.div
            key={row[0]}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15, duration: 0.35 }}
            className={`grid grid-cols-3 border-t border-border px-5 py-4 text-sm ${
              isPP
                ? "border-l-[3px] border-l-permit bg-[rgba(68,170,153,0.08)] text-signal shadow-[inset_0_0_34px_rgba(68,170,153,0.16)]"
                : "bg-ash/70 text-[#888]"
            }`}
            animate={
              isPP
                ? { boxShadow: ["inset 0 0 0 rgba(68,170,153,0)", "inset 0 0 40px rgba(68,170,153,0.28)", "inset 0 0 34px rgba(68,170,153,0.16)"] }
                : undefined
            }
          >
            <p className={isPP ? "font-semibold" : "text-[#888]"}>{row[0]}</p>
            <p className={isPP ? "font-bold text-permit" : "text-[#888]"}>{row[1]}</p>
            <p className={isPP ? "font-semibold" : "text-[#888]"}>{row[2]}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
