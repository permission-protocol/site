import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "@/src/components/CodeBlock";
import { SectionBlock } from "@/src/components/SectionBlock";

const pythonDecoratorSnippet = `from permission_protocol import require_approval

@require_approval(action="deploy", resource="billing-service")
def deploy_service():
    deploy("billing-service")

# Agent calls deploy_service()
# -> Pauses for approval
# -> Permission Protocol signs the decision
# -> Receipt is attached and execution continues`;

const steps = [
  {
    title: "Wrap your action",
    body: "Add @require_approval or an SDK authorize() call around any irreversible agent action before execution."
  },
  {
    title: "Get approval",
    body: "A human approver or policy engine approves or denies the action. Permission Protocol signs the decision."
  },
  {
    title: "Receive your receipt",
    body: "The action receives a cryptographic receipt proving who authorized what and when, ready for verification and audit."
  }
];

export const metadata: Metadata = {
  title: "How It Works | Permission Protocol",
  description: "Understand the 3-step approval and receipt flow used to enforce authority for AI actions."
};

export default function HowItWorksPage() {
  return (
    <>
      <SectionBlock
        headline="How Permission Protocol Works."
        subheadline="Three steps to enforce human or policy authority before your AI system acts."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-permit">Step {index + 1}</p>
              <h2 className="mt-3 text-xl font-semibold text-signal">{step.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-secondary">{step.body}</p>
            </article>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        headline="Implementation Example."
        subheadline="Python decorator flow with enforced approval and signed receipts."
      >
        <CodeBlock tabs={[{ label: "Python", code: pythonDecoratorSnippet }]} />
        <Link
          href="/developers/quickstart"
          data-track="pp_how_it_works_cta_click"
          className="mt-6 inline-flex items-center font-semibold text-permit"
        >
          Open Quickstart <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </SectionBlock>
    </>
  );
}
