"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";

type ReceiptShareButtonsProps = {
  receiptId: string;
  receiptJson: string;
};

export function ReceiptShareButtons({ receiptId, receiptJson }: ReceiptShareButtonsProps) {
  const [copied, setCopied] = useState<"link" | "json" | null>(null);

  const onCopy = async (type: "link" | "json") => {
    const link = `${window.location.origin}/r/${receiptId}`;
    await navigator.clipboard.writeText(type === "link" ? link : receiptJson);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const onDownload = () => {
    const blob = new Blob([receiptJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pp-receipt-${receiptId}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const buttonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-transparent px-4 py-2.5 text-sm font-semibold text-signal hover:border-permit/70 hover:bg-permit/10 hover:text-permit";

  return (
    <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
      <button onClick={() => onCopy("link")} className={buttonClass}>
        {copied === "link" ? <Check className="h-4 w-4 text-[#10B981]" /> : <Copy className="h-4 w-4" />}
        {copied === "link" ? "Copied!" : "Copy Link"}
      </button>
      <button onClick={() => onCopy("json")} className={buttonClass}>
        {copied === "json" ? <Check className="h-4 w-4 text-[#10B981]" /> : <Copy className="h-4 w-4" />}
        {copied === "json" ? "Copied!" : "Copy JSON"}
      </button>
      <button onClick={onDownload} className={buttonClass}>
        <Download className="h-4 w-4" />
        Download
      </button>
    </div>
  );
}
