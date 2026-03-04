import Link from "next/link";

const tiers = [
  ["Free", "Individual developers", "SDK, 1,000 receipts/month, approval links, proof pages"],
  ["Team", "Small teams", "Unlimited receipts, team workflows, shared policies, audit log"],
  ["Enterprise", "Large orgs", "Self-hosted authority nodes, federation, SSO, compliance exports, SLA"]
];

export default function PricingPage() {
  return (
    <section className="section-shell pt-32 pb-24">
      <h1 className="text-4xl font-bold">Pricing</h1>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <article key={tier[0]} className="card-surface p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-permit">{tier[0]}</p>
            <p className="mt-2 text-lg font-semibold">{tier[1]}</p>
            <p className="mt-3 text-secondary">{tier[2]}</p>
          </article>
        ))}
      </div>
      <div className="mt-10 flex gap-4">
        <Link href="/developers/quickstart" className="rounded-lg bg-permit px-4 py-2 font-semibold text-void">
          Install SDK
        </Link>
        <Link href="/contact" className="rounded-lg border border-border px-4 py-2 font-semibold">
          Talk to sales
        </Link>
      </div>
    </section>
  );
}
