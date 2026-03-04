import type { Metadata } from "next";
import Link from "next/link";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { SiteHeader } from "@/src/components/SiteHeader";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono"
});

export const metadata: Metadata = {
  title: "Permission Protocol | Signer of Record for AI Systems",
  description:
    "Permission Protocol issues cryptographic authority receipts that prove AI actions were authorized before execution.",
  openGraph: {
    title: "Permission Protocol",
    description: "Authority before execution for AI systems.",
    images: ["/assets/og-image.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
      <body>
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
              <Link href="/r/demo">Demo Receipt</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
