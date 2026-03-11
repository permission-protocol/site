"use client";

import { useEffect } from "react";
import { captureUtm, getUtmParams, hasUtm } from "@/lib/utm";

declare global {
  interface Window {
    posthog?: {
      capture: (eventName: string, properties?: Record<string, unknown>) => void;
      register: (properties: Record<string, string>) => void;
    };
  }
}

export function UtmCapture() {
  useEffect(() => {
    captureUtm();

    if (hasUtm()) {
      window.posthog?.register(getUtmParams() as Record<string, string>);
    }
  }, []);

  return null;
}
