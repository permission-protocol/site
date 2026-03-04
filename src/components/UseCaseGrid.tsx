import { CloudUpload, Database, Wallet, Lock, PlugZap, Workflow } from "lucide-react";

const useCases = [
  {
    icon: CloudUpload,
    title: "CI/CD Deploys",
    body: "Require an authority receipt before any AI-initiated deployment reaches production."
  },
  {
    icon: Database,
    title: "Database Operations",
    body: "Block destructive database mutations unless a signed receipt is present."
  },
  {
    icon: Wallet,
    title: "Financial Transactions",
    body: "Ensure every AI-initiated payment or transfer has explicit authorization."
  },
  {
    icon: Lock,
    title: "Data Access",
    body: "Prove who authorized access to sensitive customer or internal data."
  },
  {
    icon: PlugZap,
    title: "API Calls",
    body: "Require receipt verification at API gateways for high-impact endpoints."
  },
  {
    icon: Workflow,
    title: "Multi-Agent Orchestration",
    body: "Ensure downstream agents carry valid authority receipts from upstream approvals."
  }
];

export function UseCaseGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {useCases.map((useCase) => {
        const Icon = useCase.icon;
        return (
          <article
            key={useCase.title}
            className="rounded-2xl border border-[#222] bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-permit hover:shadow-[0_0_28px_rgba(68,170,153,0.16)]"
          >
            <Icon className="h-5 w-5 text-permit" />
            <h3 className="mt-4 text-xl font-semibold">{useCase.title}</h3>
            <p className="mt-3 text-secondary">{useCase.body}</p>
          </article>
        );
      })}
    </div>
  );
}
