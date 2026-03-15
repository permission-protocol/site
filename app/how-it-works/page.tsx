import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, CheckCheck, FileCheck2, ShieldCheck } from "lucide-react";
import { ComparisonTable } from "@/src/components/ComparisonTable";
import { ReceiptCard } from "@/src/components/ReceiptCard";
import { SectionBlock } from "@/src/components/SectionBlock";

const steps = [
  {
    title: "Wrap your action",
    body: "Add `authorize()` or `@require_approval` around irreversible agent behavior before execution.",
    code: `const receipt = await authorize({\n  action: "deploy",\n  resource: "billing-service"\n});`
  },
  {
    title: "Get approval",
    body: "Permission Protocol creates a review request, enforces policy, and waits for a human or policy decision.",
    code: `review_url = pp.request.approval_link\nstatus = await pp.wait_for_decision()`
  },
  {
    title: "Receive your receipt",
    body: "Approved actions get a signed receipt proving who authorized what, when, and under which policy.",
    code: `if receipt.verified:\n    deploy(receipt)\n    audit.log(receipt.id)`
  }
];

const lifecycle = [
  {
    title: "Agent acts",
    detail: "The model attempts a deploy, merge, payment, or other high-impact action.",
    icon: Bot,
    accent: "border-border bg-card text-signal"
  },
  {
    title: "SDK intercepts",
    detail: "The SDK fail-closes the action and turns it into an authorization request.",
    icon: ShieldCheck,
    accent: "border-permit/50 bg-permit/10 text-permit"
  },
  {
    title: "Request created",
    detail: "Permission Protocol records the action, actor, policy, and review URL.",
    icon: FileCheck2,
    accent: "border-border bg-card text-signal"
  },
  {
    title: "Human reviews",
    detail: "An approver or policy engine blocks or approves the request.",
    icon: CheckCheck,
    accent: "border-border bg-card text-signal"
  },
  {
    title: "Receipt issued",
    detail: "Approved requests get a signed authorization receipt for verification and audit.",
    icon: FileCheck2,
    accent: "border-permit/50 bg-permit/10 text-permit"
  },
  {
    title: "Action proceeds",
    detail: "The system verifies the receipt and only then executes the original action.",
    icon: CheckCheck,
    accent: "border-border bg-card text-signal"
  }
];

const receiptFields = [
  ["Action", "deploy -> billing-service"],
  ["Agent", "deploy-bot"],
  ["Approver", "Sarah Kim"],
  ["Policy", "production-deploy"],
  ["Timestamp", "2026-03-03 10:14:22 UTC"],
  ["Signature", "pp_sig_a8f2e91c..."],
  ["Verification status", "Verified"]
];

export const metadata: Metadata = {
  title: "How It Works | Permission Protocol",
  description: "See the full approval, receipt, and authority-layer flow behind Permission Protocol."
};

export default function HowItWorksPage() {
  return (
    <>
      <SectionBlock
        headline="How Permission Protocol Works."
        subheadline="Three steps to enforce human or policy authority before your AI system acts."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
          {steps.map((step, index) => (
            <div key={step.title} className="contents">
              <article className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-permit">Step {index + 1}</p>
                <h2 className="mt-3 text-xl font-semibold text-signal">{step.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-secondary">{step.body}</p>
                <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-ash/80 p-4 font-mono text-xs leading-relaxed text-signal">
                  <code>{step.code}</code>
                </pre>
              </article>
              {index < steps.length - 1 ? (
                <div className="flex items-center justify-center py-1 lg:hidden" aria-hidden>
                  <div className="h-8 w-px bg-gradient-to-b from-permit/20 via-permit to-permit/20" />
                  <ArrowRight className="mx-2 h-4 w-4 rotate-90 text-permit" />
                  <div className="h-8 w-px bg-gradient-to-b from-permit/20 via-permit to-permit/20" />
                </div>
              ) : null}
              {index < steps.length - 1 ? (
                <div className="hidden items-center justify-center lg:flex" aria-hidden>
                  <div className="h-px w-10 bg-gradient-to-r from-permit/20 via-permit to-permit/20" />
                  <ArrowRight className="mx-2 h-4 w-4 text-permit" />
                  <div className="h-px w-10 bg-gradient-to-r from-permit/20 via-permit to-permit/20" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        headline="Full lifecycle."
        subheadline="From attempted action to verified execution, the gate stays closed until authority is proven."
      >
        <div className="rounded-3xl border border-border bg-card/70 p-6 md:p-8">
          <div className="flex flex-col items-center gap-2 text-sm font-medium sm:flex-row sm:justify-center sm:gap-3">
            <span className="rounded-full border border-border bg-ash px-4 py-2">PR Created</span>
            <span className="hidden text-secondary sm:inline">→</span>
            <span className="text-secondary sm:hidden">↓</span>
            <span className="rounded-full border border-permit/50 bg-permit/10 px-4 py-2 text-permit">
              Permission Protocol
            </span>
            <span className="hidden text-secondary sm:inline">→</span>
            <span className="text-secondary sm:hidden">↓</span>
            <span className="rounded-full border border-border bg-ash px-4 py-2">Decision</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.12em]">
            <span className="rounded-full border border-danger/40 bg-danger/10 px-3 py-1 text-danger">Blocked</span>
            <span className="rounded-full border border-permit/40 bg-permit/10 px-3 py-1 text-permit">Approved</span>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lifecycle.map((item, index) => {
              const Icon = item.icon;
              const isDecision = item.title === "Human reviews";
              return (
                <div key={item.title} className="relative">
                  <article className={`h-full rounded-2xl border p-5 ${item.accent}`}>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs uppercase tracking-[0.16em] text-secondary/80">0{index + 1}</span>
                      <Icon className={`h-5 w-5 ${item.title === "Human reviews" ? "text-secondary" : ""}`} />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-secondary">{item.detail}</p>
                    {isDecision ? (
                      <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em]">
                        <span className="rounded-full border border-danger/40 bg-danger/10 px-3 py-1 text-danger">
                          Blocked
                        </span>
                        <span className="rounded-full border border-permit/40 bg-permit/10 px-3 py-1 text-permit">
                          Approved
                        </span>
                      </div>
                    ) : null}
                  </article>
                  {index < lifecycle.length - 1 ? (
                    <div className="mt-3 flex items-center gap-2 pl-3 text-permit md:hidden" aria-hidden>
                      <div className="h-6 w-px bg-permit/60" />
                      <ArrowRight className="h-4 w-4 rotate-90" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        headline="The Receipt."
        subheadline="Every approved action produces portable proof that can be inspected by humans and verified by systems."
      >
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,420px)] xl:items-start">
          <div className="flex justify-center">
            <ReceiptCard />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-permit">Receipt anatomy</p>
            <dl className="mt-4 divide-y divide-border">
              {receiptFields.map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-sm text-secondary">{label}</dt>
                  <dd className={`text-right text-sm font-medium ${label === "Verification status" ? "text-permit" : "text-signal"}`}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <Link href="/r/demo" className="mt-6 inline-flex items-center font-semibold text-permit">
              See a live receipt <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        headline="Infrastructure stack."
        subheadline="Identity tells you who requested access. Authority tells you who approved the action."
      >
        <ComparisonTable />
      </SectionBlock>

      <SectionBlock
        headline="Ready to add authority?"
        subheadline="Ship with an explicit approval gate before agents can merge, deploy, or spend."
      >
        <div className="rounded-3xl border border-permit/30 bg-gradient-to-br from-card via-ash to-[#0f1f1c] p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-lg leading-relaxed text-secondary">
              Start with the quickstart if you want code first. Talk to us if you need org-wide enforcement,
              approvals, and auditability.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/developers/quickstart"
                data-track="pp_how_it_works_get_started_click"
                className="inline-flex items-center rounded-full bg-permit px-5 py-3 font-semibold text-void transition hover:brightness-110"
              >
                Get Started
              </Link>
              <Link
                href="/contact"
                data-track="pp_how_it_works_contact_click"
                className="inline-flex items-center rounded-full border border-border px-5 py-3 font-semibold text-signal transition hover:border-permit/50 hover:text-permit"
              >
                Talk to Us
              </Link>
            </div>
          </div>
        </div>
      </SectionBlock>
    </>
  );
}
