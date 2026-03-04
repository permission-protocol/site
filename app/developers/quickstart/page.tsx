import Link from "next/link";

const terminal = `$ python agent.py\n> deploy_service() requested\n> Approval required: https://permissionprotocol.com/approve/4ac91\n> Waiting for approval...\n> ✓ Approved by sarah.kim\n> ✓ Receipt: pp_r_8f91c2\n> ✓ Deployment executed`;

export default function QuickstartPage() {
  return (
    <section className="section-shell pt-32 pb-24">
      <h1 className="text-4xl font-bold">Developers Quickstart</h1>
      <p className="mt-4 max-w-2xl text-secondary">Five minutes from zero to your first authority receipt.</p>
      <div className="mt-10 space-y-8">
        <article className="card-surface p-6">
          <h2 className="text-2xl font-semibold">1. Install</h2>
          <pre className="mt-3 overflow-auto rounded-xl bg-card p-4 font-mono text-sm">pip install permission-protocol</pre>
        </article>
        <article className="card-surface p-6">
          <h2 className="text-2xl font-semibold">2. Configure</h2>
          <pre className="mt-3 overflow-auto rounded-xl bg-card p-4 font-mono text-sm">import permission_protocol as pp{"\n"}pp.configure(api_key=&quot;pp_key_...&quot;)</pre>
        </article>
        <article className="card-surface p-6">
          <h2 className="text-2xl font-semibold">3. Add an approval guard</h2>
          <pre className="mt-3 overflow-auto rounded-xl bg-card p-4 font-mono text-sm">from permission_protocol import require_approval{"\n\n"}@require_approval{"\n"}def deploy_service():{"\n    "}deploy(&quot;billing-api&quot;)</pre>
        </article>
        <article className="card-surface p-6">
          <h2 className="text-2xl font-semibold">4. Run your agent</h2>
          <pre className="mt-3 overflow-auto rounded-xl bg-card p-4 font-mono text-sm">{terminal}</pre>
        </article>
        <article className="card-surface p-6">
          <h2 className="text-2xl font-semibold">5. Approve + Share</h2>
          <p className="mt-2 text-secondary">Approve in browser, then share your receipt proof page.</p>
          <Link href="/r/demo" className="mt-4 inline-block text-permit">
            https://permissionprotocol.com/r/8f91c2
          </Link>
        </article>
      </div>
    </section>
  );
}
