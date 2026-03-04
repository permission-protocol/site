"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const receiptJson = `{
  "receipt_id": "8f91c2",
  "actor": "deploy-bot",
  "action": "deploy",
  "resource": "billing-service",
  "approved_by": "sarah.kim",
  "policy": "production-deploy",
  "timestamp": "2026-03-03T10:14:22Z",
  "authority_issuer": "permissionprotocol.com",
  "signature": "pp_sig_a8f2e91c..."
}`;

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-sm text-[#666]">{label}</dt>
      <dd className={`text-right text-sm font-medium ${accent ? "text-permit" : "text-signal"}`}>{value}</dd>
    </div>
  );
}

export function ReceiptCard() {
  const [showJson, setShowJson] = useState(false);

  const highlightJsonLine = (line: string) => {
    const keyValueMatch = line.match(/^(\s*)"([^"]+)"(\s*:\s*)(.+?)(,?)$/);
    if (keyValueMatch) {
      const [, indent, key, separator, value, trailingComma] = keyValueMatch;
      return (
        <>
          <span className="text-[#666]">{indent}&quot;</span>
          <span className="text-permit">{key}</span>
          <span className="text-[#666]">&quot;{separator}</span>
          <span className={value.startsWith("\"") ? "text-[#10B981]" : "text-[#666]"}>{value}</span>
          <span className="text-[#666]">{trailingComma}</span>
        </>
      );
    }
    return <span className="text-[#666]">{line}</span>;
  };

  return (
    <div
      className="mx-auto w-full max-w-[520px] rounded-2xl border border-border bg-ash/80 p-8 md:p-10"
      style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
    >
      {/* Status badge */}
      <p className="inline-flex rounded-full bg-[#10B981] px-4 py-1.5 text-xs font-bold tracking-wide text-void">
        ✓ ACTION AUTHORIZED
      </p>

      {/* Action summary */}
      <p className="mt-6 text-2xl font-bold text-signal">
        Deploy → billing-service
      </p>
      <div className="mt-1 h-px bg-border" />

      {/* Receipt details */}
      <dl className="mt-2 divide-y divide-border/50">
        <Row label="Agent" value="deploy-bot" />
        <Row label="Approved by" value="Sarah Kim" />
        <Row label="Policy" value="production-deploy" />
        <Row label="Timestamp" value="2026-03-03 10:14:22 UTC" />
      </dl>

      {/* Signature verification */}
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#666]">Signature</span>
          <span className="text-sm font-semibold text-[#10B981]">Verified ✓</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-[#666]">Issuer</span>
          <span className="text-sm font-medium text-permit">Permission Protocol</span>
        </div>
      </div>

      {/* Expandable JSON */}
      <button
        onClick={() => setShowJson(!showJson)}
        className="mt-5 flex w-full items-center gap-2 text-xs text-[#666] hover:text-signal"
      >
        <ChevronDown className={`h-3 w-3 transition-transform ${showJson ? "rotate-180" : ""}`} />
        Technical Details
      </button>
      <AnimatePresence>
        {showJson && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-[#0f0f0f] p-4 font-mono text-xs leading-relaxed">
              <code>
                {receiptJson.split("\n").map((line, index) => (
                  <span key={`${line}-${index}`} className="block">
                    {highlightJsonLine(line)}
                  </span>
                ))}
              </code>
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt URL */}
      <p className="mt-5 text-center font-mono text-xs text-permit">
        permissionprotocol.com/r/8f91c2
      </p>
    </div>
  );
}
