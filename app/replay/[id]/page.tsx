import Link from "next/link";

const events = [
  ["10:14:12", "Agent proposes action", "deploy billing-service", "neutral"],
  ["10:14:13", "Permission Protocol evaluates", "Policy: production-deploy", "neutral"],
  ["10:14:14", "Human approval required", "Approval link sent to sarah.kim", "warning"],
  ["10:14:16", "Approved by Sarah Kim", "", "success"],
  ["10:14:17", "Authority receipt issued", "Receipt: pp_r_8f91c2", "success"],
  ["10:14:18", "Deployment executed", "", "success"]
] as const;

export default function ReplayPage({ params }: { params: { id: string } }) {
  return (
    <section className="section-shell min-h-screen pt-32 pb-24">
      <h1 className="text-4xl font-bold">AI Action Replay</h1>
      <p className="mt-2 text-secondary">Replay ID: {params.id}</p>
      <div className="mt-10 space-y-6 border-l border-border pl-6">
        {events.map((event) => (
          <article key={`${event[0]}-${event[1]}`} className="relative">
            <span
              className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ${
                event[3] === "success" ? "bg-permit" : event[3] === "warning" ? "bg-warning" : "bg-secondary"
              }`}
            />
            <p className="text-sm text-secondary">{event[0]}</p>
            <p className="font-semibold">{event[1]}</p>
            {event[2] ? <p className="text-sm text-secondary">{event[2]}</p> : null}
          </article>
        ))}
      </div>
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
