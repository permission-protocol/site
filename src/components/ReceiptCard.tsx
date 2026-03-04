"use client";

import { motion } from "framer-motion";

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
  return (
    <div className="group [perspective:1200px]">
      <motion.div
        whileHover={{ rotateY: 180 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative h-[420px] w-full max-w-xl [transform-style:preserve-3d]"
      >
        <article className="absolute inset-0 rounded-2xl border border-border bg-card p-6 [backface-visibility:hidden]">
          <p className="font-semibold text-permit">ACTION AUTHORIZED</p>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-secondary">Action</dt><dd>deploy</dd></div>
            <div className="flex justify-between"><dt className="text-secondary">Resource</dt><dd>billing-service</dd></div>
            <div className="flex justify-between"><dt className="text-secondary">Agent</dt><dd>deploy-bot</dd></div>
            <div className="flex justify-between"><dt className="text-secondary">Approved by</dt><dd>Sarah Kim</dd></div>
            <div className="flex justify-between"><dt className="text-secondary">Policy</dt><dd>production-deploy</dd></div>
            <div className="flex justify-between"><dt className="text-secondary">Timestamp</dt><dd>2026-03-03 10:14 UTC</dd></div>
            <div className="flex justify-between"><dt className="text-secondary">Signature</dt><dd className="text-permit">Verified</dd></div>
            <div className="flex justify-between"><dt className="text-secondary">Issuer</dt><dd>Permission Protocol</dd></div>
          </dl>
          <p className="mt-6 font-mono text-xs text-permit">permissionprotocol.com/r/8f91c2</p>
        </article>

        <article className="absolute inset-0 rounded-2xl border border-permit/40 bg-[#0f1212] p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="mb-4 font-semibold text-permit">Raw Authority Receipt</p>
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-signal">
            <code>{receiptJson}</code>
          </pre>
        </article>
      </motion.div>
    </div>
  );
}
