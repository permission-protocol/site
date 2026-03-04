import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DiagramFlow } from "@/src/components/DiagramFlow";

export function Hero() {
  return (
    <section className="section-shell pt-36 pb-24">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-permit/40 bg-permit/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-permit">
            Signer of Record
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-6xl">
            AI agents shouldn&apos;t authorize their own actions.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-secondary">
            Permission Protocol is the Signer of Record for AI systems, issuing cryptographic receipts that prove an
            action was authorized before it happens.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/developers/quickstart"
              className="inline-flex items-center rounded-xl bg-permit px-5 py-3 font-semibold text-void transition hover:brightness-110"
            >
              Get Started - Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center rounded-xl border border-border px-5 py-3 font-semibold text-signal transition hover:border-permit/50"
            >
              See How It Works
            </a>
          </div>
        </div>
        <div className="card-surface p-8">
          <DiagramFlow />
        </div>
      </div>
    </section>
  );
}
