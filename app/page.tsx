import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { CTABanner } from "@/src/components/CTABanner";
import { CodeBlock } from "@/src/components/CodeBlock";
import { ComparisonTable } from "@/src/components/ComparisonTable";
import { CopyCommandButton } from "@/src/components/CopyCommandButton";
import { Hero } from "@/src/components/Hero";
import { ReceiptCard } from "@/src/components/ReceiptCard";
import { SectionBlock } from "@/src/components/SectionBlock";
import { StackDiagram } from "@/src/components/StackDiagram";
import { UseCaseGrid } from "@/src/components/UseCaseGrid";

const howItWorksCode = `receipt = pp.authorize(\n    action="deploy",\n    resource="billing-service"\n)\n\ndeploy(receipt)  # Pipeline verifies the receipt`;

const developerTabs = [
  {
    label: "Python",
    code: `from permission_protocol import require_approval\n\n@require_approval\ndef deploy_service():\n    deploy("billing-api")\n\n# Agent calls deploy_service()\n# -> Paused until authorized\n# -> Receipt issued\n# -> Execution continues`
  },
  {
    label: "Node.js",
    code: `import { authorize } from '@permissionprotocol/sdk';\n\nconst receipt = await authorize({\n  action: "deploy",\n  resource: "billing-service"\n});\n\nawait deploy(receipt);`
  },
  {
    label: "Terminal",
    code: `$ pp authorize --action deploy --resource billing-service\n\n✓ Authorization required\n    Approval link: https://permissionprotocol.com/approve/4ac91\n    Waiting for approval...\n\n✓ Approved by sarah.kim\n✓ Receipt issued: pp_r_8f91c2\n✓ View: https://permissionprotocol.com/r/8f91c2`
  }
];

export default function HomePage() {
  return (
    <>
      <Hero />

      <SectionBlock
        headline="Today, AI agents authorize themselves."
        subheadline="When AI systems deploy code, access data, or move money - nothing proves who approved it."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-danger/40 bg-danger/10 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-danger">Today - No Authority Layer</p>
            <p className="mt-4 text-lg font-semibold">Agent → Tool → Execution</p>
            <ul className="mt-6 space-y-3 text-secondary">
              <li className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-danger" /> No approval
              </li>
              <li className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-danger" /> No proof
              </li>
              <li className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-danger" /> No accountability
              </li>
            </ul>
          </article>
          <article className="rounded-2xl border border-permit/40 bg-permit/10 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-permit">With Permission Protocol</p>
            <p className="mt-4 text-lg font-semibold">Agent → PP → Receipt → Execution</p>
            <ul className="mt-6 space-y-3 text-secondary">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-permit" /> Approved
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-permit" /> Verified
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-permit" /> Auditable
              </li>
            </ul>
          </article>
        </div>
      </SectionBlock>

      <SectionBlock
        headline="The authority layer for AI systems."
        subheadline="Permission Protocol sits between AI decisions and real-world execution - issuing cryptographic proof that authority existed before the action occurred."
      >
        <StackDiagram />
      </SectionBlock>

      <SectionBlock
        id="how-it-works"
        headline="Three steps. One receipt. Full accountability."
        subheadline="Every consequential AI action flows through Permission Protocol before execution."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-permit">1. Agent Proposes</p>
            <p className="mt-2 text-secondary">An AI agent requests permission for deploys, deletes, transfers, or access.</p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-permit">2. PP Authorizes</p>
            <p className="mt-2 text-secondary">Policies are evaluated, approvals collected, and a cryptographic authority receipt is issued.</p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-permit">3. Infra Verifies</p>
            <p className="mt-2 text-secondary">The execution system verifies the receipt before allowing the action.</p>
          </article>
        </div>
        <div className="mt-8">
          <CodeBlock tabs={[{ label: "Python", code: howItWorksCode }]} />
          <Link href="/developers/quickstart" className="mt-5 inline-flex items-center font-semibold text-permit">
            Try the SDK <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </SectionBlock>

      <SectionBlock
        headline="The primitive that proves authority existed."
        subheadline="Every authorized action produces a signed, portable, verifiable receipt."
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <ReceiptCard />
          <Link href="/r/demo" className="inline-flex items-center self-start font-semibold text-permit">
            See a live receipt <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </SectionBlock>

      <SectionBlock
        headline="Every critical system has an authority layer. AI doesn&apos;t - until now."
        subheadline="Permission Protocol completes the infrastructure stack."
      >
        <ComparisonTable />
      </SectionBlock>

      <SectionBlock
        headline="One line of code. Full authority."
        subheadline="Add approval guards to any AI agent in seconds."
      >
        <CodeBlock tabs={developerTabs} />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CopyCommandButton command="pip install permission-protocol" />
          <Link href="/developers/quickstart" className="font-semibold text-permit">
            Read the Quickstart -&gt;
          </Link>
        </div>
      </SectionBlock>

      <SectionBlock headline="Authority for every consequential AI action.">
        <UseCaseGrid />
        <Link href="/developers/quickstart" className="mt-6 inline-flex items-center font-semibold text-permit">
          Get Started <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </SectionBlock>

      <SectionBlock headline="Trusted by teams building the future of autonomous systems.">
        <div className="grid gap-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-secondary">Logo Bar</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm md:grid-cols-5">
              {["Apex Labs", "Northstar", "Vertex AI Ops", "Helm", "Sovereign Cloud"].map((logo) => (
                <div key={logo} className="rounded-lg border border-border bg-ash px-3 py-2 text-secondary">
                  {logo}
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-card p-5">
              <p className="text-3xl font-semibold text-gradient">2.1M+</p>
              <p className="mt-1 text-secondary">Authority receipts issued</p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-5">
              <p className="text-3xl font-semibold text-gradient">14,000+</p>
              <p className="mt-1 text-secondary">Developers using the SDK</p>
            </article>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        headline="Authority before execution. Start now."
        subheadline="Free for individual developers. Enterprise plans for teams that need enforcement at scale."
      >
        <CTABanner />
      </SectionBlock>
    </>
  );
}
