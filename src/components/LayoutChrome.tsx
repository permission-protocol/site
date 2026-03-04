"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/src/components/SiteHeader";

export function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome =
    pathname.startsWith("/r/") || pathname.startsWith("/replay/") || pathname.startsWith("/approve/");

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <footer className="border-t border-[#222] py-12">
        <div className="section-shell flex flex-col justify-between gap-6 text-sm text-secondary md:flex-row md:items-center">
          <div>
            <p className="font-semibold text-signal">Powered by Permission Protocol</p>
            <p className="mt-1">© 2026 Permission Protocol</p>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link href="/">Home</Link>
            <Link href="/developers/quickstart">Quickstart</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/contact">Contact</Link>
            <a href="/blog">Blog</a>
            <Link href="/r/demo">Demo Receipt</Link>
            <a href="https://github.com/Roca-Ventures/permissionprotocol-site" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://twitter.com/PermissionPrtcl" target="_blank" rel="noopener noreferrer">Twitter</a>
          </div>
        </div>
      </footer>
    </>
  );
}
