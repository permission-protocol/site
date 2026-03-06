import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="section-shell flex min-h-[100svh] items-center justify-center py-24 text-center">
      <div className="mx-auto flex max-w-5xl flex-col items-center">
        <h1 className="text-6xl font-medium leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
          AI agents shouldn&apos;t authorize their own actions.
        </h1>
        <svg
          width="120"
          height="120"
          viewBox="0 0 16 16"
          fill="none"
          className="mt-10"
          style={{ shapeRendering: "geometricPrecision" }}
        >
          <rect x="1.5" y="1.5" width="13" height="13" stroke="#c8c8c8" strokeWidth="1.2" fill="none" />
          <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="#c8c8c8" strokeWidth="1.2" />
          <line x1="8" y1="1.5" x2="8" y2="5.5" stroke="#c8c8c8" strokeWidth="1.2" />
          <line x1="8" y1="10.5" x2="8" y2="14.5" stroke="#c8c8c8" strokeWidth="1.2" />
        </svg>
        <p className="mt-8 max-w-2xl text-lg text-secondary md:text-xl">
          Permission Protocol is the Signer of Record for AI systems.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/developers/quickstart" className="btn-primary">
            Get Started - Free <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <a href="#how-it-works" className="btn-secondary">
            See How It Works
          </a>
        </div>
      </div>
    </section>
  );
}
