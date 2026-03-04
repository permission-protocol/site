import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

const approvedEvents = [
  ["10:14:12", "Agent proposes action", "deploy billing-service", "neutral"],
  ["10:14:13", "Permission Protocol evaluates", "Policy: production-deploy", "neutral"],
  ["10:14:14", "Human approval required", "Approval link sent to sarah.kim", "warning"],
  ["10:14:16", "Approved by Sarah Kim", "", "success"],
  ["10:14:17", "Authority receipt issued", "Receipt: pp_r_8f91c2", "success"],
  ["10:14:18", "Deployment executed", "", "success"]
] as const;

const blockedEvents = [
  ["10:14:12", "Agent proposes action", "deploy billing-service", "neutral"],
  ["10:14:13", "Permission Protocol evaluates", "Policy: production-deploy", "neutral"],
  ["10:14:14", "Human approval required", "Approval link sent to sarah.kim", "warning"],
  ["10:14:16", "ACTION BLOCKED", "Rejected by Sarah Kim", "blocked"]
] as const;

export default function ReplayPage({ params }: { params: { id: string } }) {
  const isBlocked = params.id.toLowerCase().includes("blocked");
  const events = isBlocked ? blockedEvents : approvedEvents;
  const blockedIndex = events.findIndex((event) => event[3] === "blocked");

  return (
    <section className="section-shell min-h-screen pt-32 pb-24">
      <h1 className="text-4xl font-bold">AI Action Replay</h1>
      <p className="mt-2 text-secondary">Replay ID: {params.id}</p>
      <div className="relative mt-10 space-y-6 pl-6">
        <div
          className={`absolute bottom-0 left-0 top-0 w-px ${isBlocked ? "bg-transparent" : "bg-permit/50"}`}
          style={isBlocked && blockedIndex >= 0 ? { height: `${blockedIndex * 96 + 40}px`, backgroundColor: "#44aa99" } : undefined}
        />
        {events.map((event, index) => (
          <article key={`${event[0]}-${event[1]}`} className="relative min-h-[72px]">
            <span
              className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ${
                event[3] === "blocked" ? "bg-danger" : "bg-permit"
              }`}
            />
            <p className="text-sm text-secondary">{event[0]}</p>
            <p className={`${event[1] === "ACTION BLOCKED" ? "text-2xl font-bold text-danger" : "font-semibold"}`}>{event[1]}</p>
            {event[2] ? <p className="text-sm text-secondary">{event[2]}</p> : null}
            {!isBlocked && index === events.length - 1 ? (
              <span className="mt-2 inline-flex items-center gap-2 text-sm text-[#10B981]">
                <CheckCircle2 className="h-4 w-4 drop-shadow-[0_0_10px_rgba(16,185,129,0.55)]" />
                Verified completion
              </span>
            ) : null}
          </article>
        ))}
      </div>
      {isBlocked ? (
        <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
          <XCircle className="h-6 w-6 animate-pulse text-danger" />
          <p className="text-2xl font-bold text-danger">ACTION BLOCKED</p>
        </div>
      ) : null}
      <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-sm text-secondary">
        <p className="font-semibold text-signal">Artifacts</p>
        <div className="mt-2 flex gap-4">
          <Link href="/r/demo" className="text-permit">Receipt</Link>
          <Link href="/approve/demo" className="text-permit">Approval request</Link>
          <button>Raw events export</button>
        </div>
      </div>
      <Link href="/developers/quickstart" className="mt-6 inline-block text-permit">
        Powered by Permission Protocol - Get Started Free -&gt;
      </Link>
    </section>
  );
}
