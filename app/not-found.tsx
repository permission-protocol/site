import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section-shell pt-40 pb-24 text-center">
      <h1 className="text-4xl font-bold">Page not found</h1>
      <p className="mt-3 text-secondary">The requested page does not exist.</p>
      <Link href="/" className="mt-5 inline-block text-permit">
        Return home
      </Link>
    </section>
  );
}
