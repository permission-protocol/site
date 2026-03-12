import type { Metadata } from "next";
import { ReceiptPageClient } from "./ReceiptPageClient";
import { fetchReceiptViewData } from "@/src/lib/receiptData";

type ReceiptPageProps = {
  params: { id: string };
};

export async function generateMetadata({ params }: ReceiptPageProps): Promise<Metadata> {
  const receipt = await fetchReceiptViewData(params.id);
  const repo = receipt?.repo ?? "Unknown repo";
  const username = receipt?.approved_by ?? "unknown";
  const prNumber = receipt?.pr_number;

  return {
    title: `Receipt ${params.id} | Permission Protocol`,
    description: receipt
      ? `Cryptographic receipt proving ${repo}${prNumber ? ` PR #${prNumber}` : ""} was authorized by @${username}`
      : "Cryptographic receipt proving this action was authorized before execution.",
    openGraph: {
      title: receipt
        ? `Deploy Authorized — ${repo} — Approved by @${username}`
        : `Permission Protocol Receipt ${params.id}`,
      description: receipt
        ? `Cryptographic receipt proving ${repo}${prNumber ? ` PR #${prNumber}` : ""} was authorized by @${username}`
        : "Verified authority receipt for an AI action.",
      images: ["/assets/og-image.png"]
    }
  };
}

export default function ReceiptPage({ params }: ReceiptPageProps) {
  return <ReceiptPageClient id={params.id} />;
}
