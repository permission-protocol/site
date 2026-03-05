import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { LayoutChrome } from "@/src/components/LayoutChrome";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono"
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Permission Protocol",
  applicationCategory: "DeveloperApplication",
  description:
    "The Signer of Record for AI systems. Cryptographic authority receipts that prove every action was authorized before execution.",
  url: "https://permissionprotocol.com",
  operatingSystem: "Cross-platform",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Organization",
    name: "Permission Protocol",
    url: "https://permissionprotocol.com",
    sameAs: [
      "https://twitter.com/PermissionPrtcl",
      "https://github.com/permission-protocol",
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init("phc_p8CF1B4nuU6nDEYHj4GfOZrOejgkN8BX75kzPZrE6bc",{api_host:"https://us.i.posthog.com",person_profiles:"identified_only"});`,
          }}
        />
      </head>
      <body>
        <LayoutChrome>{children}</LayoutChrome>
      </body>
    </html>
  );
}
