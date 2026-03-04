import type { Metadata } from "next";
import { QuickstartPageClient } from "./QuickstartPageClient";

export const metadata: Metadata = {
  title: "Developers Quickstart | Permission Protocol",
  description: "Install the SDK, add an approval guard, and issue your first authority receipt in minutes.",
  openGraph: {
    title: "Permission Protocol Quickstart",
    description: "Go from zero to your first authority receipt in 5 minutes.",
    images: ["/assets/og-image.png"]
  }
};

export default function QuickstartPage() {
  return <QuickstartPageClient />;
}
