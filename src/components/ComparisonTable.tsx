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
      <div className="grid grid-cols-3 bg-card px-5 py-3 text-xs uppercase tracking-[0.14em] text-secondary">
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
              isPP ? "bg-permit/10 text-signal shadow-[inset_0_0_30px_rgba(68,170,153,0.14)]" : "bg-ash/70"
            }`}
          >
            <p className={isPP ? "font-semibold" : "text-secondary"}>{row[0]}</p>
            <p className={isPP ? "font-semibold text-permit" : "text-signal"}>{row[1]}</p>
            <p className={isPP ? "font-semibold" : "text-secondary"}>{row[2]}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
