"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md transition-all duration-200 ${
        scrolled ? "border-border bg-void/95" : "border-border/70 bg-void/75"
      }`}
    >
      <div className="section-shell flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-signal"
            width="20"
            height="20"
            viewBox="0 0 16 16"
            fill="none"
            style={{ shapeRendering: "crispEdges" }}
          >
            <rect x="1.5" y="1.5" width="13" height="13" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="8" y1="1.5" x2="8" y2="5.5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="8" y1="10.5" x2="8" y2="14.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="hidden text-sm font-medium tracking-[0.08em] md:inline">
            <span className="text-signal">PERMISSION</span>
            <span className="text-permit">/</span>
            <span className="text-signal">PROTOCOL</span>
          </span>
        </Link>
        <Link href="/developers/quickstart" className="btn-primary rounded-lg px-4 py-2 md:hidden">
          Get Started
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-secondary md:flex">
          <a href="/#how-it-works" className="hover:text-signal">
            How It Works
          </a>
          <Link href="/developers/quickstart" className="hover:text-signal">
            Developers
          </Link>
          <Link href="/pricing" className="hover:text-signal">
            Pricing
          </Link>
          <Link href="/contact" className="hover:text-signal">
            Contact
          </Link>
          <Link href="/developers/quickstart" className="btn-primary rounded-lg px-4 py-2">
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
