"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getUtmParams, hasUtm } from "@/lib/utm";

declare global {
  interface Window {
    posthog?: {
      capture: (eventName: string, properties?: Record<string, unknown>) => void;
      register: (properties: Record<string, string>) => void;
    };
  }
}

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || !window.posthog) {
      return;
    }

    let url = window.origin + pathname;
    const query = searchParams?.toString();

    if (query) {
      url = `${url}?${query}`;
    }

    const properties: Record<string, unknown> = { $current_url: url };

    if (hasUtm()) {
      Object.assign(properties, getUtmParams());
    }

    window.posthog.capture("$pageview", properties);
  }, [pathname, searchParams]);

  return null;
}
