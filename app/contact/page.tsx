export default function ContactPage() {
  return (
    <section className="section-shell pt-32 pb-24">
      <h1 className="text-4xl font-bold">Contact</h1>
      <p className="mt-4 max-w-2xl text-secondary">
        We&apos;ll review your enforcement points, map receipt verification, and propose a pilot.
      </p>
      <form className="mt-10 grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
        {[
          "Name",
          "Email",
          "Company",
          "Use case",
          "Environment",
          "Timeline"
        ].map((field) => (
          <label key={field} className="text-sm text-secondary">
            {field}
            <input className="mt-2 w-full rounded-lg border border-border bg-ash px-3 py-2 text-signal" />
          </label>
        ))}
        <button className="btn-primary md:col-span-2 justify-center rounded-lg px-4 py-2">Submit</button>
      </form>
    </section>
  );
}
