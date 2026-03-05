import type { Metadata } from "next";
import { ReplayPageClient } from "./ReplayPageClient";

type ReplayPageProps = {
  params: { id: string };
};

export function generateMetadata({ params }: ReplayPageProps): Metadata {
  return {
    title: `Action Replay ${params.id} | Permission Protocol`,
    description: "Timeline replay of authorization and execution with verified artifacts.",
    openGraph: {
      title: `Permission Protocol Replay ${params.id}`,
      description: "End-to-end replay of AI authorization events.",
      images: ["/assets/og-image.png"]
    }
  };
}

export default function ReplayPage({ params }: ReplayPageProps) {
  return <ReplayPageClient id={params.id} />;
}
