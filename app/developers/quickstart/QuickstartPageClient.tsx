"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { CopyCommandButton } from "@/src/components/CopyCommandButton";

const reveal = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.3, ease: "easeOut" }
};

const terminalLines = [
  { text: "$ python agent.py", tone: "default" },
  { text: "> deploy_service() requested", tone: "default" },
  { text: "> Authorization required", tone: "teal" },
  { text: "> Approval link: https://permissionprotocol.com/approve/4ac91", tone: "default" },
  { text: "> Waiting for approval...", tone: "amber" },
  { text: ">", tone: "default" },
  { text: "> ✓ Approved by sarah.kim", tone: "green" },
  { text: "> ✓ Receipt issued: pp_r_8f91c2", tone: "green" },
  { text: "> ✓ Deployment executed", tone: "green" }
] as const;

function StepCard({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <motion.article {...reveal} className="rounded-lg border border-border bg-ash p-6">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-permit text-sm font-bold text-white">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold text-signal">{title}</h2>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </motion.article>
  );
}

function TerminalLine({ text, tone }: { text: string; tone: (typeof terminalLines)[number]["tone"] }) {
  const color =
    tone === "green"
      ? "text-[#10B981]"
      : tone === "amber"
        ? "text-warning"
        : tone === "teal"
          ? "text-permit"
          : "text-signal";

  return <p className={`font-mono text-xs leading-6 sm:text-sm ${color}`}>{text}</p>;
}

export function QuickstartPageClient() {
  return (
    <section className="bg-void pb-24 pt-28">
      <div className="mx-auto w-full max-w-[720px] px-6">
        <motion.header {...reveal}>
          <p className="text-xs uppercase tracking-[0.22em] text-permit">Quickstart</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-signal">Your first authority receipt in 5 minutes.</h1>
          <p className="mt-4 text-lg text-secondary">
            Install the SDK, add an approval guard, and share your first receipt.
          </p>
        </motion.header>

        <div className="mt-12 space-y-7">
          <StepCard step={1} title="Install the SDK">
            <div className="rounded-xl border border-border bg-card p-4">
              <code className="font-mono text-sm text-signal">pip install permission-protocol</code>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <CopyCommandButton command="pip install permission-protocol" />
              <p className="text-sm text-secondary">
                Also available: <code className="font-mono text-signal">npm install @permissionprotocol/sdk</code>
              </p>
            </div>
          </StepCard>

          <StepCard step={2} title="Configure your API key">
            <pre className="overflow-x-auto rounded-xl border border-border bg-card p-4 font-mono text-sm text-signal">
              <code>{`import permission_protocol as pp\npp.configure(api_key="pp_key_...")`}</code>
            </pre>
            <p className="mt-3 text-sm text-secondary">Get your free API key at permissionprotocol.com/developers</p>
          </StepCard>

          <StepCard step={3} title="Protect a risky action">
            <pre className="overflow-x-auto rounded-xl border border-border bg-card p-4 font-mono text-sm text-signal">
              <code>{`from permission_protocol import require_approval\n\n@require_approval\ndef deploy_service():\n    deploy("billing-api")`}</code>
            </pre>
            <p className="mt-3 text-sm text-secondary">
              Any function decorated with <code className="font-mono text-signal">@require_approval</code> will pause until
              authorized.
            </p>
          </StepCard>

          <StepCard step={4} title="See it in action">
            <div className="overflow-hidden rounded-xl border border-border bg-[#0f0f0f]">
              <div className="flex items-center gap-2 border-b border-border bg-[#121212] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="space-y-0.5 px-4 py-4">
                {terminalLines.map((line) => (
                  <TerminalLine key={line.text} text={line.text} tone={line.tone} />
                ))}
              </div>
            </div>
          </StepCard>

          <StepCard step={5} title="Approve the action">
            <p className="text-secondary">Open the approval link. Review the action details. Click Approve.</p>
            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <p className="inline-flex rounded-full border border-warning/60 bg-warning/15 px-3 py-1 text-xs font-bold text-warning">
                APPROVAL REQUIRED
              </p>
              <div className="mt-4 space-y-1">
                <p className="text-lg font-semibold text-signal">deploy_service -&gt; billing-api</p>
                <p className="text-sm text-secondary">Agent: release-bot-v2</p>
                <p className="text-sm text-secondary">Requested by: ci.prod.pipeline</p>
              </div>
              <div className="mt-4 rounded-lg border border-border bg-ash p-3 text-sm text-secondary">
                Deploy unblocks invoice generation hotfix for EMEA.
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button className="rounded-lg bg-[#10B981] px-3 py-2 text-sm font-semibold text-void">Approve</button>
                <button className="rounded-lg border border-danger bg-danger/10 px-3 py-2 text-sm font-semibold text-signal">
                  Reject
                </button>
              </div>
            </div>
          </StepCard>

          <StepCard step={6} title="Share your proof">
            <div className="rounded-xl border border-border bg-card p-4">
              <code className="font-mono text-sm text-signal">https://permissionprotocol.com/r/8f91c2</code>
            </div>
            <p className="mt-3 text-secondary">
              Paste this link anywhere - Slack, GitHub PRs, Jira tickets, compliance docs. Anyone who clicks sees
              verified proof of authorization.
            </p>
            <div className="mt-4 rounded-2xl border border-border bg-[#111] p-4">
              <p className="inline-flex rounded-full border border-[#10B981]/40 bg-[#10B981]/15 px-3 py-1 text-xs font-bold text-[#10B981]">
                ACTION AUTHORIZED
              </p>
              <p className="mt-3 text-sm font-semibold text-signal">deploy_service -&gt; billing-api</p>
              <dl className="mt-3 divide-y divide-border/70">
                <div className="flex items-center justify-between py-2 text-xs">
                  <dt className="text-muted">Approved by</dt>
                  <dd className="text-signal">sarah.kim</dd>
                </div>
                <div className="flex items-center justify-between py-2 text-xs">
                  <dt className="text-muted">Timestamp</dt>
                  <dd className="text-signal">2026-03-03 10:14:22 UTC</dd>
                </div>
                <div className="flex items-center justify-between py-2 text-xs">
                  <dt className="text-muted">Signature</dt>
                  <dd className="text-[#10B981]">Verified</dd>
                </div>
              </dl>
            </div>
          </StepCard>
        </div>

        <motion.section {...reveal} className="mt-12 border-t border-border pt-10">
          <h2 className="text-2xl font-semibold text-signal">What&apos;s next?</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              "Verify receipts in CI/CD",
              "Explore the SDK API",
              "Join the community"
            ].map((label) => (
              <a
                key={label}
                href="#"
                className="rounded-lg border border-border bg-ash p-4 hover:border-permit/60 hover:bg-permit/10"
              >
                <p className="text-sm font-semibold text-signal">{label}</p>
                <span className="mt-2 inline-flex rounded-full border border-permit/50 bg-permit/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-permit">
                  Coming soon
                </span>
              </a>
            ))}
          </div>
        </motion.section>

        <motion.div {...reveal} className="mt-10">
          <Link href="/contact" className="text-lg font-semibold text-permit hover:text-[#6ac9b7]">
            Questions? Talk to us -&gt;
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
