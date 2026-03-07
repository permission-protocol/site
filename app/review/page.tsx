import type { Metadata } from "next";
import { ReviewDashboard } from "./ReviewDashboard";

export const metadata: Metadata = {
  title: "Review Queue | Permission Protocol",
  description: "All pending deploy requests awaiting your approval.",
};

export default function ReviewPage() {
  return <ReviewDashboard />;
}
