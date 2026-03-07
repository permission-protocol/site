"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Github } from "lucide-react";
import { signIn, useSession } from "next-auth/react";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen bg-void px-6 py-20 text-signal">
        <div className="mx-auto w-full max-w-md text-center">
          <p className="text-signal/70">Loading…</p>
        </div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/review";

  useEffect(() => {
    if (status === "authenticated") {
      window.location.href = callbackUrl;
    }
  }, [status, callbackUrl]);

  if (status === "authenticated") {
    return (
      <main className="relative min-h-screen bg-void px-6 py-20 text-signal">
        <div className="mx-auto w-full max-w-md text-center">
          <p className="text-signal/70">Redirecting…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-void px-6 py-20 text-signal">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-black/25">
        <div className="mb-8 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-ash">
            <svg
              className="h-5 w-5 text-signal"
              width="20"
              height="20"
              viewBox="0 0 16 16"
              fill="none"
              style={{ shapeRendering: "crispEdges" }}
            >
              <rect x="1.5" y="1.5" width="13" height="13" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="currentColor" strokeWidth="1.5" />
              <line x1="8" y1="1.5" x2="8" y2="5.5" stroke="currentColor" strokeWidth="1.5" />
              <line x1="8" y1="10.5" x2="8" y2="14.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          <div className="text-sm tracking-[0.08em]">
            <span className="font-medium">PERMISSION</span>
            <span className="px-1 text-permit">/</span>
            <span className="text-signal/70">PROTOCOL</span>
          </div>
        </div>

        <h1 className="text-2xl font-semibold">Sign in to continue</h1>
        <p className="mt-3 text-sm text-signal/70">
          Sign in to review and approve deploy requests for your organization.
        </p>

        <button
          type="button"
          onClick={() => signIn("github", { callbackUrl })}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-ash px-4 py-3 font-medium text-signal transition hover:border-permit hover:text-permit"
        >
          <Github className="h-4 w-4" />
          Sign in with GitHub
        </button>
      </div>
    </main>
  );
}
