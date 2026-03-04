import Link from "next/link";
import { BadgeCheck, CheckCircle2 } from "lucide-react";
import { ReceiptShareButtons } from "@/src/components/ReceiptShareButtons";

export default function ReceiptPage({ params }: { params: { id: string } }) {
  return (
    <section className="section-shell flex min-h-screen items-center justify-center py-32">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <p className="inline-flex rounded-full bg-[#10B981] px-3 py-1 text-xs font-semibold text-void">Verified</p>
        <div className="flex items-center gap-2 text-permit">
          <CheckCircle2 className="h-6 w-6" />
          <p className="text-lg font-semibold">ACTION AUTHORIZED</p>
        </div>
        <p className="mt-6 text-xl font-semibold">Deploy -&gt; billing-service</p>
        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-secondary">Approved by</dt><dd>Sarah Kim</dd></div>
          <div className="flex justify-between"><dt className="text-secondary">Policy</dt><dd>production-deploy</dd></div>
          <div className="flex justify-between"><dt className="text-secondary">Timestamp</dt><dd>2026-03-03 10:14:22 UTC</dd></div>
          <div className="flex justify-between">
            <dt className="flex items-center gap-1 text-secondary">
              Signature <BadgeCheck className="h-4 w-4 text-secondary" />
            </dt>
            <dd className="text-permit">Verified</dd>
          </div>
          <div className="flex justify-between"><dt className="text-secondary">Issuer</dt><dd>Permission Protocol</dd></div>
        </dl>
        <details className="mt-6 rounded-xl border border-border bg-ash p-4 text-sm text-secondary">
          <summary className="cursor-pointer text-signal">Verification details</summary>
          <p className="mt-2">Signature algorithm: Ed25519 • Key ID: pp-main-2026 • Authority chain: valid</p>
          <pre className="mt-3 overflow-auto font-mono text-xs">{`{ "receipt_id": "${params.id}", "signature": "pp_sig_..." }`}</pre>
        </details>
        <ReceiptShareButtons receiptId={params.id} />
        <Link href="/developers/quickstart" className="mt-6 inline-block text-permit">
          Powered by Permission Protocol - Get Started Free -&gt;
        </Link>
      </div>
    </section>
  );
}
