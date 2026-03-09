import Link from "next/link";
import { ArrowRight, Github, Package, ShieldCheck } from "lucide-react";
import { CTABanner } from "@/src/components/CTABanner";
import { CodeBlock } from "@/src/components/CodeBlock";
import { ComparisonTable } from "@/src/components/ComparisonTable";
import { CopyCommandButton } from "@/src/components/CopyCommandButton";
import { Hero } from "@/src/components/Hero";
import { ReceiptCard } from "@/src/components/ReceiptCard";
import { SectionBlock } from "@/src/components/SectionBlock";
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
        headline="Your AI agent just pushed to production."
        subheadline="No receipt. No review. No human."
      >
        <div className="my-10 flex justify-center">
          <svg width="200" height="200" viewBox="0 0 16 16" fill="none" style={{ shapeRendering: "geometricPrecision" }}>
            <rect x="1.5" y="1.5" width="13" height="13" stroke="#aa4455" strokeWidth="1.2" fill="none" />
            <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="#aa4455" strokeWidth="1.2" />
            <line x1="8" y1="1.5" x2="8" y2="5.5" stroke="#aa4455" strokeWidth="1.2" />
            <line x1="8" y1="10.5" x2="8" y2="14.5" stroke="#aa4455" strokeWidth="1.2" />
          </svg>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-danger/40 bg-danger/10 p-6">
            <p className="text-xs uppercase tracking-[0.15em] text-danger">Without Permission Protocol</p>
            <div className="mt-6 flex justify-center">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="30" stroke="#aa4455" strokeWidth="2" fill="none" />
                <line x1="28" y1="28" x2="52" y2="52" stroke="#aa4455" strokeWidth="2" />
                <line x1="52" y1="28" x2="28" y2="52" stroke="#aa4455" strokeWidth="2" />
              </svg>
            </div>
            <ul className="mt-6 space-y-3 text-center text-secondary">
              <li>No enforced gate</li>
              <li>Agents deploy unchecked</li>
              <li>Trust is implicit</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-permit/40 bg-permit/10 p-6">
            <p className="text-xs uppercase tracking-[0.15em] text-permit">With Permission Protocol</p>
            <div className="mt-6 flex justify-center">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <rect x="20" y="20" width="40" height="40" stroke="#44aa99" strokeWidth="2" fill="none" />
                <line x1="20" y1="40" x2="60" y2="40" stroke="#44aa99" strokeWidth="2" />
                <line x1="40" y1="20" x2="40" y2="34" stroke="#44aa99" strokeWidth="2" />
                <line x1="40" y1="46" x2="40" y2="60" stroke="#44aa99" strokeWidth="2" />
              </svg>
            </div>
            <ul className="mt-6 space-y-3 text-center text-secondary">
              <li>Cryptographic receipts</li>
              <li>Fail-closed by default</li>
              <li>Auditable authority</li>
            </ul>
          </article>
        </div>
      </SectionBlock>

      <SectionBlock
        id="how-it-works"
        headline="How it works."
        subheadline="Every consequential AI action flows through Permission Protocol before execution."
      >
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-col items-center gap-2 text-sm font-medium sm:flex-row sm:justify-center sm:gap-3">
            <span className="rounded-full border border-border bg-ash px-4 py-2">PR Created</span>
            <span className="hidden text-secondary sm:inline">→</span>
            <span className="text-secondary sm:hidden">↓</span>
            <span className="rounded-full border border-permit/50 bg-permit/10 px-4 py-2 text-permit">Permission Protocol</span>
            <span className="hidden text-secondary sm:inline">→</span>
            <span className="text-secondary sm:hidden">↓</span>
            <span className="rounded-full border border-border bg-ash px-4 py-2">Decision</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.12em]">
            <span className="rounded-full border border-danger/40 bg-danger/10 px-3 py-1 text-danger">Blocked</span>
            <span className="rounded-full border border-permit/40 bg-permit/10 px-3 py-1 text-permit">Approved</span>
          </div>
        </div>
        <div className="mt-8">
          <CodeBlock tabs={[{ label: "Python", code: howItWorksCode }]} />
          <Link href="/developers/quickstart" className="mt-5 inline-flex items-center font-semibold text-permit">
            Try the SDK <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </SectionBlock>

      <section className="section-shell py-8">
        <div className="rounded-2xl border border-border bg-card/70 px-4 py-4 sm:px-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-ash/60 px-3 py-3">
              <ShieldCheck className="h-4 w-4 shrink-0 text-permit" />
              <p className="text-[11px] uppercase tracking-[0.14em] text-secondary">
                NIST AI Agent Standards
                <span className="ml-1 text-signal">Official Respondent</span>
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-ash/60 px-3 py-3">
              <Package className="h-4 w-4 shrink-0 text-permit" />
              <p className="text-[11px] uppercase tracking-[0.14em] text-secondary">
                Published on
                <span className="ml-1 text-signal">npm &amp; PyPI</span>
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-ash/60 px-3 py-3">
              <Github className="h-4 w-4 shrink-0 text-permit" />
              <p className="text-[11px] uppercase tracking-[0.14em] text-secondary">
                Open Source
                <span className="ml-1 text-signal">SDK</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <SectionBlock
        headline="The Receipt."
        subheadline="Every authorized action produces a signed, portable, verifiable receipt."
      >
        <p className="text-3xl font-semibold text-secondary">Fail closed. Evidence, not logs.</p>
        <div className="mt-8 flex justify-center">
          <ReceiptCard />
        </div>
        <div className="mt-6 text-center">
          <Link href="/r/demo" className="inline-flex items-center font-semibold text-permit">
            See a live receipt <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </SectionBlock>

      <SectionBlock
        headline="What happens when an AI agent deploys without you?"
        subheadline="Permission Protocol completes the infrastructure stack."
      >
        <ComparisonTable />
      </SectionBlock>

      <SectionBlock
        headline="One line. Full authority."
        subheadline="Add approval guards to any AI agent in seconds."
      >
        <CodeBlock tabs={developerTabs} />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CopyCommandButton
            commands={[
              { id: "python", command: "pip install permission-protocol" },
              { id: "javascript", command: "npm install @permissionprotocol/sdk" }
            ]}
          />
          <Link href="/developers/quickstart" className="font-semibold text-permit">
            Read the Quickstart -&gt;
          </Link>
        </div>
      </SectionBlock>

      <SectionBlock headline="Designed for irreversible systems.">
        <UseCaseGrid />
        <Link href="/developers/quickstart" className="mt-6 inline-flex items-center font-semibold text-permit">
          Get Started <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </SectionBlock>

      <SectionBlock
        headline="The gate is always closed."
        subheadline="Free for individual developers. Enterprise plans for teams that need enforcement at scale."
      >
        <CTABanner />
      </SectionBlock>
    </>
  );
}
