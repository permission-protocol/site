"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, ShieldCheck } from "lucide-react";
import { ReceiptShareButtons } from "@/src/components/ReceiptShareButtons";
import { demoReceipt, toTechnicalJson } from "@/src/lib/artifactDemo";

type ReceiptPageClientProps = {
  id: string;
};

export function ReceiptPageClient({ id }: ReceiptPageClientProps) {
  const state = id.toLowerCase().includes("invalid")
    ? "INVALID"
    : id.toLowerCase().includes("expired")
      ? "EXPIRED"
      : "ACTION AUTHORIZED";

  const isAuthorized = state === "ACTION AUTHORIZED";
  const technicalJson = JSON.stringify(toTechnicalJson(id), null, 2);

  const statusClass = isAuthorized
    ? "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40"
    : "bg-danger/20 text-danger border-danger/40";

  const statusGlyph = isAuthorized ? "✓" : "✕";
  const actionLabel = `${demoReceipt.action} -> ${demoReceipt.resource}`;

  return (
    <section className="min-h-screen bg-void px-4 py-10 sm:px-6 md:py-14">
      <div className="mx-auto flex w-full max-w-[520px] flex-col items-center">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full rounded-[28px] border border-[#222] bg-ash p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:p-10"
        >
          <div className={`inline-flex items-center rounded-full border px-4 py-2 text-base font-bold ${statusClass}`}>
            {statusGlyph} {state}
          </div>

          <div className="mt-7 border-b border-border pb-6">
            <h1 className="text-2xl font-bold text-signal">{actionLabel}</h1>
          </div>

          <dl className="mt-4 divide-y divide-border/70">
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-muted">Agent</dt>
              <dd className="text-sm text-signal">{demoReceipt.actor}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-muted">Approved by</dt>
              <dd className="text-sm text-signal">{demoReceipt.approved_by}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-muted">Policy</dt>
              <dd className="text-sm text-signal">{demoReceipt.policy}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-muted">Timestamp</dt>
              <dd className="text-sm text-signal">2026-03-03 10:14:22 UTC</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <p className="inline-flex items-center gap-2 text-base font-semibold text-[#10B981]">
                <ShieldCheck className="h-4 w-4" /> Signature: Verified ✓
              </p>
              <Lock className="h-4 w-4 text-[#10B981]/70" />
            </div>
            <p className="mt-2 text-sm text-permit">Issuer: Permission Protocol</p>
          </div>

          <details className="mt-6 rounded-xl border border-border bg-[#111] px-4 py-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-signal">
              Technical Details ▾
            </summary>
            <div className="mt-3 space-y-1.5 text-sm text-secondary">
              <p>Signature Algorithm: Ed25519</p>
              <p>Key ID: pp_key_2026_03</p>
              <p>Authority Chain: [Permission Protocol Root]</p>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-void p-3 font-mono text-xs leading-5">
              <code>
                {technicalJson
                  .replace(/"([^"]+)":/g, '"§$1§":')
                  .split("§")
                  .map((part, index) => {
                    if (index % 2 === 1) {
                      return (
                        <span key={`${part}-${index}`} className="text-permit">
                          {part}
                        </span>
                      );
                    }
                    return part.split(/("[^"]*"\s*[\],}]?)/g).map((chunk, subIndex) => {
                      if (/^"[^"]*"\s*[\],}]?$/.test(chunk)) {
                        return (
                          <span key={`${chunk}-${subIndex}`} className="text-[#10B981]">
                            {chunk}
                          </span>
                        );
                      }
                      return (
                        <span key={`${chunk}-${subIndex}`} className="text-muted">
                          {chunk}
                        </span>
                      );
                    });
                  })}
              </code>
            </pre>
          </details>
        </motion.article>

        <ReceiptShareButtons receiptId={id} receiptJson={technicalJson} />

        <footer className="mt-9 text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-secondary">Permission Protocol</p>
          <p className="mt-1 text-sm text-secondary">Powered by Permission Protocol</p>
          <Link href="/developers/quickstart" className="mt-2 inline-block text-sm font-semibold text-permit hover:text-[#6ac9b7]">
            Add to your pipeline →
          </Link>
        </footer>
      </div>
    </section>
  );
}
