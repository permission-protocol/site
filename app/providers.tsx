"use client";

import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { PostHogPageView } from "@/components/PostHogPageView";
import { UtmCapture } from "@/components/UtmCapture";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UtmCapture />
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </SessionProvider>
  );
}
