"use client";

import { useState } from "react";
import { Check, Terminal } from "lucide-react";

export function CopyCommandButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1000);
  };

  return (
    <button
      onClick={onCopy}
      className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 font-mono text-sm"
    >
      {copied ? <Check className="mr-2 h-4 w-4 text-permit" /> : <Terminal className="mr-2 h-4 w-4 text-permit" />}
      {copied ? "Copied" : command}
    </button>
  );
}
