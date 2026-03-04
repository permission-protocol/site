import type { Metadata } from "next";
import { ContactPageClient } from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contact | Permission Protocol",
  description: "Tell us your agent use case and we will map authority receipt enforcement points.",
  openGraph: {
    title: "Permission Protocol Contact",
    description: "Let's map your enforcement points.",
    images: ["/assets/og-image.png"]
  }
};

export default function ContactPage() {
  return <ContactPageClient />;
}
