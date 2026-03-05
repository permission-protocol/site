import type { Metadata } from "next";
import { PricingPageClient } from "./PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing | Permission Protocol",
  description: "Start free and scale authority enforcement with signed receipts and team workflows.",
  openGraph: {
    title: "Permission Protocol Pricing",
    description: "Start free. Scale with authority.",
    images: ["/assets/og-image.png"]
  }
};

export default function PricingPage() {
  return <PricingPageClient />;
}
