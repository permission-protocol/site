import type { Metadata } from "next";
import { ReceiptPageClient } from "./ReceiptPageClient";

type ReceiptPageProps = {
  params: { id: string };
};

export function generateMetadata({ params }: ReceiptPageProps): Metadata {
  return {
    title: `Receipt ${params.id} | Permission Protocol`,
    description: "Cryptographic receipt proving this action was authorized before execution.",
    openGraph: {
      title: `Permission Protocol Receipt ${params.id}`,
      description: "Verified authority receipt for an AI action.",
      images: ["/assets/og-image.png"]
    }
  };
}

export default function ReceiptPage({ params }: ReceiptPageProps) {
  return <ReceiptPageClient id={params.id} />;
}
