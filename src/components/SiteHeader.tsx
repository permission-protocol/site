"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  const username = session?.login ?? session?.user?.login ?? session?.user?.name ?? "User";
  const avatar = session?.user?.image;

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
          <span className="hidden text-sm tracking-[0.08em] md:inline">
            <span className="font-medium text-signal">PERMISSION</span>
            <span className="font-light text-permit">/</span>
            <span className="font-light text-signal/60">PROTOCOL</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            className="rounded-lg p-2 text-secondary transition-colors hover:text-signal"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 5L15 15" />
                <path d="M15 5L5 15" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 5H17" />
                <path d="M3 10H17" />
                <path d="M3 15H17" />
              </svg>
            )}
          </button>
          <Link href="/developers/quickstart" className="btn-primary rounded-lg px-4 py-2">
            Get Started
          </Link>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-secondary md:flex">
          <Link href="/how-it-works" className="hover:text-signal">
            How It Works
          </Link>
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
            href="https://github.com/permission-protocol"
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
          {status === "authenticated" ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-ash px-2 py-1.5 text-signal"
              >
                {avatar ? (
                  <span
                    role="img"
                    aria-label={username}
                    className="h-6 w-6 rounded-full border border-border bg-cover bg-center"
                    style={{ backgroundImage: `url(${avatar})` }}
                  />
                ) : (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-xs">
                    {username.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="max-w-24 truncate text-xs">{username}</span>
              </button>
              {userMenuOpen ? (
                <div className="absolute right-0 top-full mt-2 min-w-36 rounded-lg border border-border bg-card p-1 shadow-lg shadow-black/35">
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full rounded-md px-3 py-2 text-left text-xs text-secondary hover:bg-ash hover:text-signal"
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>
      </div>
      <div
        id="mobile-nav-menu"
        className={`fixed inset-x-0 top-16 z-40 md:hidden ${
          mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
          className={`fixed inset-0 top-16 bg-void/55 transition-opacity duration-200 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <nav
          className={`relative w-full border-b border-border bg-void px-6 py-5 text-secondary transition-all duration-200 ${
            mobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-4 text-sm">
            <Link href="/how-it-works" className="hover:text-signal" onClick={() => setMobileMenuOpen(false)}>
              How It Works
            </Link>
            <Link href="/developers/quickstart" className="hover:text-signal" onClick={() => setMobileMenuOpen(false)}>
              Developers
            </Link>
            <Link href="/pricing" className="hover:text-signal" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </Link>
            <Link href="/contact" className="hover:text-signal" onClick={() => setMobileMenuOpen(false)}>
              Contact
            </Link>
            <a href="/blog" className="hover:text-signal" onClick={() => setMobileMenuOpen(false)}>
              Blog
            </a>
            <a
              href="https://github.com/permission-protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-2 hover:text-signal"
              title="GitHub"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
            <Link
              href="/developers/quickstart"
              className="btn-primary mt-1 inline-flex w-fit rounded-lg px-4 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
