"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

const receiptJson = `{
  "receipt_id": "8f91c2",
  "actor": "deploy-bot",
  "action": "deploy",
  "resource": "billing-service",
  "approved_by": "sarah.kim",
  "policy": "production-deploy",
  "timestamp": "2026-03-03T10:14:22Z",
  "authority_issuer": "permissionprotocol.com",
  "signature": "pp_sig_..."
}`;

export function ReceiptCard() {
  const [flipped, setFlipped] = useState(false);

  const toggle = () => setFlipped((prev) => !prev);
  const highlightJsonLine = (line: string) => {
    const keyValueMatch = line.match(/^(\s*)"([^"]+)"(\s*:\s*)(.+?)(,?)$/);
    if (keyValueMatch) {
      const [, indent, key, separator, value, trailingComma] = keyValueMatch;
      return (
        <>
          <span className="text-[#666]">{indent}</span>
          <span className="text-[#666]">&quot;</span>
          <span className="text-[#44aa99]">{key}</span>
          <span className="text-[#666]">&quot;</span>
          <span className="text-[#666]">{separator}</span>
          <span className={value.startsWith("\"") ? "text-[#10B981]" : "text-[#666]"}>{value}</span>
          <span className="text-[#666]">{trailingComma}</span>
        </>
      );
    }

    return <span className="text-[#666]">{line}</span>;
  };

  return (
    <div className="group [perspective:1200px]">
      <motion.div
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
        whileHover={{ rotateY: 180, y: -4 }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className="relative h-[480px] w-full max-w-md cursor-pointer sm:max-w-lg md:max-w-xl [transform-style:preserve-3d]"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
        role="button"
        tabIndex={0}
        aria-label="Flip receipt card"
      >
        <article className="absolute inset-0 rounded-2xl border border-border bg-card p-6 [backface-visibility:hidden]">
          <p className="inline-flex rounded-full bg-[#10B981] px-3 py-1 text-xs font-semibold text-void">✓ ACTION AUTHORIZED</p>
          <span className="absolute right-5 top-5 text-muted" title="Click to see JSON">
            <RotateCcw className="h-4 w-4" />
          </span>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="grid grid-cols-[120px_1fr] gap-2"><dt className="text-secondary">Action</dt><dd className="text-right font-medium">deploy</dd></div>
            <div className="grid grid-cols-[120px_1fr] gap-2"><dt className="text-secondary">Resource</dt><dd className="text-right font-medium">billing-service</dd></div>
            <div className="grid grid-cols-[120px_1fr] gap-2"><dt className="text-secondary">Agent</dt><dd className="text-right font-medium">deploy-bot</dd></div>
            <div className="grid grid-cols-[120px_1fr] gap-2"><dt className="text-secondary">Approved by</dt><dd className="text-right font-medium">Sarah Kim</dd></div>
            <div className="grid grid-cols-[120px_1fr] gap-2"><dt className="text-secondary">Policy</dt><dd className="text-right font-medium">production-deploy</dd></div>
            <div className="grid grid-cols-[120px_1fr] gap-2"><dt className="text-secondary">Timestamp</dt><dd className="text-right font-medium">2026-03-03 10:14 UTC</dd></div>
          </dl>
          <div className="mt-4 border-t border-border pt-4">
            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm"><dt className="text-secondary">Signature</dt><dd className="text-right font-medium text-permit">Verified ✓</dd></div>
            <div className="mt-2 grid grid-cols-[120px_1fr] gap-2 text-sm"><dt className="text-secondary">Issuer</dt><dd className="text-right font-medium text-permit">Permission Protocol</dd></div>
          </div>
          <p className="mt-6 font-mono text-xs text-permit">permissionprotocol.com/r/8f91c2</p>
        </article>

        <article className="absolute inset-0 rounded-2xl border border-permit/40 bg-[#0f1212] p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="mb-4 font-semibold text-permit">Raw Authority Receipt</p>
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed">
            <code>
              {receiptJson.split("\n").map((line, index) => (
                <span key={`${line}-${index}`} className="block">
                  {highlightJsonLine(line)}
                </span>
              ))}
            </code>
          </pre>
        </article>
      </motion.div>
    </div>
  );
}
