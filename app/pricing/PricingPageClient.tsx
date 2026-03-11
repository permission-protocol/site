"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const reveal = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.3, ease: "easeOut" }
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    suffix: "/month",
    subtitle: "For individual developers",
    features: [
      "SDK access (Python + Node)",
      "1,000 receipts/month",
      "Approval links",
      "Receipt proof pages",
      "Community support"
    ],
    cta: "Get Started",
    ctaHref: "/developers/quickstart",
    ctaClass: "border border-permit text-permit hover:bg-permit/10",
    highlight: false
  },
  {
    name: "Team",
    price: "Coming Soon",
    suffix: "",
    subtitle: "For teams shipping with agents",
    features: [
      "Everything in Free",
      "Unlimited receipts",
      "Team approval workflows",
      "Shared policies",
      "Audit log & export",
      "Priority support"
    ],
    cta: "Join Waitlist",
    ctaHref: "/contact",
    ctaClass: "bg-permit text-void hover:brightness-110",
    highlight: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    suffix: "",
    subtitle: "For organizations at scale",
    features: [
      "Everything in Team",
      "Self-hosted authority nodes",
      "Federation support",
      "SSO / SAML",
      "Compliance exports (SOC 2, ISO 27001)",
      "Dedicated support & SLA"
    ],
    cta: "Talk to Sales",
    ctaHref: "/contact",
    ctaClass: "border border-border text-signal hover:border-permit/60 hover:bg-permit/10",
    highlight: false
  }
] as const;

export function PricingPageClient() {
  return (
    <section className="bg-void pb-24 pt-28">
      <div className="section-shell mx-auto w-full max-w-[900px]">
        <motion.header {...reveal}>
          <p className="text-xs uppercase tracking-[0.22em] text-permit">Pricing</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-signal">Start free. Scale with authority.</h1>
          <p className="mt-4 text-lg text-secondary">
            Every plan includes the core primitive: signed authority receipts.
          </p>
        </motion.header>

        <motion.section {...reveal} className="mt-12 grid gap-5 md:grid-cols-3">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`relative flex h-full flex-col rounded-2xl bg-ash p-6 ${
                tier.highlight ? "border border-permit shadow-glow" : "border border-border"
              }`}
            >
              {tier.highlight ? (
                <span className="absolute -top-3 left-6 inline-flex rounded-full border border-permit/70 bg-permit px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-void">
                  Most Popular
                </span>
              ) : null}

              <h2 className="text-2xl font-semibold text-signal">{tier.name}</h2>
              <div className="mt-3 flex items-end gap-1">
                <p className="text-4xl font-bold text-signal">{tier.price}</p>
                {tier.suffix ? <p className="pb-1 text-sm text-secondary">{tier.suffix}</p> : null}
              </div>
              <p className="mt-2 text-sm text-secondary">{tier.subtitle}</p>

              <ul className="mt-6 space-y-3 text-sm text-signal">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-permit" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.ctaHref}
                data-track={tier.highlight ? "pp_pricing_cta_click" : "pp_pricing_secondary_click"}
                className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${tier.ctaClass}`}
              >
                {tier.cta}
              </Link>
            </article>
          ))}
        </motion.section>

        <motion.section {...reveal} className="mt-12 rounded-2xl border border-border bg-ash p-6">
          <h2 className="text-xl font-semibold text-signal">Start with the primitive</h2>
          <p className="mt-3 text-secondary">
            Every plan starts the same way: install the SDK, add @require_approval, get your first receipt.
            Enforcement grows from there.
          </p>
          <Link
            href="/developers/quickstart"
            data-track="pp_pricing_secondary_click"
            className="mt-5 inline-flex font-semibold text-permit hover:text-[#6ac9b7]"
          >
            Read the Quickstart -&gt;
          </Link>
        </motion.section>
      </div>
    </section>
  );
}
