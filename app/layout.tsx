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
  metadataBase: new URL("https://permissionprotocol.com"),
  title: "Permission Protocol | Signer of Record for AI Systems",
  description:
    "Permission Protocol issues cryptographic authority receipts that prove AI actions were authorized before execution.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "Permission Protocol — AI agents shouldn't authorize their own actions.",
    description: "The Signer of Record for AI systems. Cryptographic authority receipts that prove every action was authorized before execution.",
    images: ["/assets/og-image.png"],
    siteName: "Permission Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Permission Protocol — AI agents shouldn't authorize their own actions.",
    description: "The Signer of Record for AI systems.",
    images: ["/assets/og-image.png"],
    creator: "@PermissionPrtcl",
  },
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
