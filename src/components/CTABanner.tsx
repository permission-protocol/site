import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTABanner() {
  return (
    <div>
      <div className="grid gap-4 rounded-3xl border border-border bg-ash p-5 md:grid-cols-2 md:p-8">
        <article className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-2xl font-semibold">For Developers</h3>
          <p className="mt-3 text-secondary">Install the SDK, issue authority receipts, and enforce before execution in minutes.</p>
          <Link href="/developers/quickstart" className="mt-6 inline-flex items-center font-semibold text-permit">
            Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </article>
        <article className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-2xl font-semibold">For Enterprise</h3>
          <p className="mt-3 text-secondary">Human-in-the-loop approvals, self-hosted authority, and compliance-grade audit proof.</p>
          <Link href="/contact" className="mt-6 inline-flex items-center font-semibold text-permit">
            Talk to Us <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </article>
      </div>
    </div>
  );
}
