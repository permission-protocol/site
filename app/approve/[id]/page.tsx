import type { Metadata } from "next";
import { ApprovePageClient } from "./ApprovePageClient";

type ApprovePageProps = {
  params: { id: string };
};

export function generateMetadata({ params }: ApprovePageProps): Metadata {
  return {
    title: `Approval ${params.id} | Permission Protocol`,
    description: "Review and approve or reject an AI action before execution.",
    openGraph: {
      title: `Permission Protocol Approval ${params.id}`,
      description: "Human approval workflow for high-impact AI actions.",
      images: ["/assets/og-image.png"]
    }
  };
}

export default function ApprovePage({ params }: ApprovePageProps) {
  return <ApprovePageClient id={params.id} />;
}
