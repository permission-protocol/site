"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type ReceiptShareButtonsProps = {
  receiptId: string;
};

export function ReceiptShareButtons({ receiptId }: ReceiptShareButtonsProps) {
  const [copied, setCopied] = useState<"link" | "json" | null>(null);

  const onCopy = async (type: "link" | "json") => {
    const link = `${window.location.origin}/r/${receiptId}`;
    const json = `{ "receipt_id": "${receiptId}", "signature": "pp_sig_..." }`;
    await navigator.clipboard.writeText(type === "link" ? link : json);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1100);
  };

  return (
    <div className="mt-6 flex gap-3 text-sm">
      <button onClick={() => onCopy("link")} className="btn-secondary rounded-lg px-3 py-2">
        {copied === "link" ? <Check className="mr-1.5 h-4 w-4 text-[#10B981]" /> : <Copy className="mr-1.5 h-4 w-4" />}
        Copy Link
      </button>
      <button onClick={() => onCopy("json")} className="btn-secondary rounded-lg px-3 py-2">
        {copied === "json" ? <Check className="mr-1.5 h-4 w-4 text-[#10B981]" /> : <Copy className="mr-1.5 h-4 w-4" />}
        Copy JSON
      </button>
      <button className="btn-secondary rounded-lg px-3 py-2">Download</button>
    </div>
  );
}
