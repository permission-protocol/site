import Link from "next/link";

export default function ApprovePage({ params }: { params: { id: string } }) {
  return (
    <section className="section-shell min-h-screen pt-32 pb-24">
      <h1 className="text-4xl font-bold">Approval Request {params.id}</h1>
      <p className="mt-4 text-warning">Identity verified via signed token.</p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-secondary">Agent deploy-bot requests deploy on billing-service.</p>
        <p className="mt-2 inline-block rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning">High impact</p>
        <textarea
          placeholder="Optional comment"
          className="mt-6 w-full rounded-xl border border-border bg-ash p-3 text-sm"
          rows={4}
        />
        <div className="mt-4 flex gap-3">
          <button className="rounded-lg bg-permit px-4 py-2 font-semibold text-void">Approve</button>
          <button className="rounded-lg bg-danger px-4 py-2 font-semibold text-void">Reject</button>
        </div>
        <p className="mt-4 text-sm text-secondary">
          Approve result issues a receipt at <Link href="/r/demo" className="text-permit">/r/demo</Link>. Reject records block event.
        </p>
      </div>
    </section>
  );
}
