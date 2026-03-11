"use client";

import Link from "next/link";
import { CheckCircle2, Github, Package, Star, Twitter } from "lucide-react";
import { usePathname } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";
import { getUtmParams } from "@/lib/utm";
import { SiteHeader } from "@/src/components/SiteHeader";

export function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [subEmail, setSubEmail] = useState("");
  const [subState, setSubState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const handleSubscribe = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setSubState("sending");
    try {
      const utm = getUtmParams();
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subEmail, utm }),
      });
      if (!res.ok) throw new Error();
      setSubState("done");
    } catch {
      setSubState("error");
    }
  }, [subEmail]);
  const hideChrome =
    pathname.startsWith("/r/") ||
    pathname.startsWith("/replay/") ||
    pathname.startsWith("/approve/") ||
    pathname.startsWith("/review/");

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <footer className="border-t border-[#222] py-12">
        <div className="section-shell grid gap-8 text-sm text-secondary lg:grid-cols-[1.1fr_1fr_1fr]">
          <div className="space-y-3">
            <p className="font-semibold text-signal">Powered by Permission Protocol</p>
            <p>© 2026 Permission Protocol</p>
            <p className="text-xs uppercase tracking-[0.14em] text-permit">NIST Respondent 2026</p>
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-ash px-3 py-2 font-mono text-xs text-signal">
              <Package className="h-3.5 w-3.5 text-permit" />
              npm install permission-protocol
            </div>
          </div>

          <div className="flex flex-wrap content-start gap-5">
            <Link href="/" className="hover:text-signal">
              Home
            </Link>
            <Link href="/how-it-works" className="hover:text-signal">
              How It Works
            </Link>
            <Link href="/developers/quickstart" className="hover:text-signal">
              Quickstart
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
            <Link href="/r/demo" className="hover:text-signal">
              Demo Receipt
            </Link>
            <a
              href="https://github.com/permission-protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-signal"
            >
              <Github className="h-4 w-4" />
              GitHub
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]">
                <Star className="h-3 w-3 text-permit" />
                1.2k
              </span>
            </a>
            <a
              href="https://twitter.com/PermissionPrtcl"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-signal"
            >
              <Twitter className="h-4 w-4" />
              @PermissionPrtcl
            </a>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.14em] text-signal">Stay Updated</p>
            <p className="text-xs text-secondary">Get product and release updates.</p>
            {subState === "done" ? (
              <div className="flex items-center gap-2 rounded-lg border border-permit/50 bg-permit/10 px-3 py-2 text-sm font-semibold text-permit">
                <CheckCircle2 className="h-4 w-4" />
                You&apos;re in. We&apos;ll be in touch.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                <label htmlFor="footer-email" className="sr-only">
                  Email
                </label>
                <input
                  id="footer-email"
                  type="email"
                  required
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-border bg-ash px-3 py-2 text-sm text-signal placeholder:text-secondary focus:border-permit focus:outline-none focus:ring-2 focus:ring-permit/40"
                />
                <button
                  type="submit"
                  disabled={subState === "sending"}
                  className="rounded-lg bg-permit px-4 py-2 font-semibold text-void hover:brightness-110 disabled:opacity-60"
                >
                  {subState === "sending" ? "..." : subState === "error" ? "Retry" : "Subscribe"}
                </button>
              </form>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}
