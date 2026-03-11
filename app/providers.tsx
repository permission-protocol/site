"use client";

import { SessionProvider } from "next-auth/react";
import { UtmCapture } from "@/components/UtmCapture";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UtmCapture />
      {children}
    </SessionProvider>
  );
}
