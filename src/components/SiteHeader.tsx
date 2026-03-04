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
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.08em]">
          Permission Protocol
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
          <Link href="/developers/quickstart" className="btn-primary rounded-lg px-4 py-2">
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
