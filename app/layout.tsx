import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { LayoutChrome } from "@/src/components/LayoutChrome";
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
        <LayoutChrome>{children}</LayoutChrome>
      </body>
    </html>
  );
}
