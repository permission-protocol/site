import type { Metadata } from "next";
import { ReviewPageClient } from "./ReviewPageClient";

type ReviewPageProps = {
  params: { id: string };
};

export function generateMetadata({ params }: ReviewPageProps): Metadata {
  return {
    title: `Review ${params.id} | Permission Protocol`,
    description: "Review and decide permission requests before execution.",
    openGraph: {
      title: `Permission Protocol Review ${params.id}`,
      description: "Governance review surface for approval decisions.",
      images: ["/assets/og-image.png"]
    }
  };
}

export default function ReviewPage({ params }: ReviewPageProps) {
  return <ReviewPageClient id={params.id} />;
}
