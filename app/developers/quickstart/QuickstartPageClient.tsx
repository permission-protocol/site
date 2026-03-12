"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ReactNode, useState } from "react";
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

const installTabs = [
  { id: "python", label: "Python", code: "pip install permission-protocol" },
  { id: "javascript", label: "TypeScript / JavaScript", code: "npm install @permissionprotocol/sdk" }
] as const;

const configTabs = [
  {
    id: "python",
    label: "Python",
    code: `import permission_protocol as pp\n\npp.configure(api_key="pp_key_...")`
  },
  {
    id: "javascript",
    label: "TypeScript / JavaScript",
    code: `import { configure } from "@permissionprotocol/sdk";\n\nconfigure({\n  apiKey: process.env.PERMISSION_PROTOCOL_API_KEY!\n});`
  }
] as const;

const protectTabs = [
  {
    id: "python",
    label: "Python Decorator",
    code: `from permission_protocol import require_approval\n\n@require_approval\ndef deploy_service():\n    deploy("billing-api")`
  },
  {
    id: "javascript",
    label: "JS Wrapper",
    code: `import { withApproval } from "@permissionprotocol/sdk";\n\nconst deployService = withApproval(\n  async () => {\n    await deploy("billing-api");\n  },\n  { action: "deploy_service" }\n);`
  }
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

  return <p className={`font-mono overflow-x-auto whitespace-nowrap text-xs leading-6 sm:text-sm ${color}`}>{text}</p>;
}

type CodeTabsProps = {
  tabs: readonly {
    id: string;
    label: string;
    code: string;
  }[];
  ariaLabel: string;
  showCopyButton?: boolean;
  helperText?: (activeTabId: string) => ReactNode;
};

function CodeTabs({ tabs, ariaLabel, showCopyButton = false, helperText }: CodeTabsProps) {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "");
  if (tabs.length === 0) return null;

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  return (
    <>
      <div role="tablist" aria-label={ariaLabel} className="inline-flex rounded-lg border border-border bg-card p-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTabId(tab.id)}
              className={`rounded-md px-2.5 py-2 text-xs font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-sm ${
                isActive ? "bg-permit/20 text-permit" : "text-secondary hover:bg-ash hover:text-signal"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-card px-4 py-4 font-mono text-xs text-signal sm:text-sm">
        <code className="overflow-x-auto">{activeTab.code}</code>
      </pre>
      {showCopyButton ? (
        <div className="mt-3">
          <CopyCommandButton
            commands={tabs.map((tab) => ({ id: tab.id, command: tab.code }))}
            activeCommandId={activeTab.id}
          />
        </div>
      ) : null}
      {helperText ? <p className="mt-3 text-sm text-secondary">{helperText(activeTab.id)}</p> : null}
    </>
  );
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
            <CodeTabs tabs={installTabs} ariaLabel="SDK install commands" showCopyButton />
          </StepCard>

          <StepCard step={2} title="Configure your API key">
            <CodeTabs tabs={configTabs} ariaLabel="SDK configuration examples" />
            <p className="mt-3 text-sm text-secondary">Get your free API key at permissionprotocol.com/developers</p>
          </StepCard>

          <StepCard step={3} title="Protect a risky action">
            <CodeTabs
              tabs={protectTabs}
              ariaLabel="Approval guard examples"
              helperText={(activeTabId) =>
                activeTabId === "python" ? (
                  <>
                    Any function decorated with <code className="font-mono text-signal">@require_approval</code> will pause
                    until authorized.
                  </>
                ) : (
                  <>
                    Any function wrapped with <code className="font-mono text-signal">withApproval(...)</code> will pause
                    until authorized.
                  </>
                )
              }
            />
          </StepCard>

          <StepCard step={4} title="See it in action">
            <div className="overflow-hidden rounded-xl border border-border bg-[#0f0f0f]">
              <div className="flex items-center gap-2 border-b border-border bg-[#121212] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="space-y-0.5 overflow-x-auto px-4 py-4">
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
              <code className="font-mono break-all text-xs text-signal sm:text-sm">
                https://permissionprotocol.com/r/8f91c2
              </code>
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
            <a href="#" className="rounded-lg border border-border bg-ash p-4 hover:border-permit/60 hover:bg-permit/10">
              <p className="text-sm font-semibold text-signal">Verify receipts in CI/CD</p>
              <span className="mt-2 inline-flex rounded-full border border-permit/50 bg-permit/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-permit">
                Private Beta
              </span>
            </a>
            <div className="rounded-lg border border-border bg-ash p-4">
              <p className="text-sm font-semibold text-signal">Explore the SDK API</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <a
                  href="https://github.com/permission-protocol/python-sdk"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-permit hover:text-[#6ac9b7]"
                >
                  Python SDK
                </a>
                <a
                  href="https://www.npmjs.com/package/@permissionprotocol/sdk"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-permit hover:text-[#6ac9b7]"
                >
                  npm package
                </a>
              </div>
            </div>
            <a href="#" className="rounded-lg border border-border bg-ash p-4 hover:border-permit/60 hover:bg-permit/10">
              <p className="text-sm font-semibold text-signal">Join the community</p>
              <span className="mt-2 inline-flex rounded-full border border-permit/50 bg-permit/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-permit">
                Private Beta
              </span>
            </a>
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
