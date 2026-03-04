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
          <a href="/blog" className="hover:text-signal">
            Blog
          </a>
          <a
            href="https://github.com/Roca-Ventures/permissionprotocol-site"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-signal"
            title="GitHub"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <Link href="/developers/quickstart" className="btn-primary rounded-lg px-4 py-2">
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
