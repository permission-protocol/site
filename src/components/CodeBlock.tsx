"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type Tab = {
  label: string;
  code: string;
};

type CodeBlockProps = {
  tabs: Tab[];
};

export function CodeBlock({ tabs }: CodeBlockProps) {
  const [active, setActive] = useState(tabs[0]?.label ?? "");
  const [copied, setCopied] = useState(false);
  const current = tabs.find((tab) => tab.label === active) ?? tabs[0];

  if (!current) return null;

  const onCopy = async () => {
    await navigator.clipboard.writeText(current.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1000);
  };

  const highlightLine = (line: string) => {
    const commentMatch = line.match(/(#.*$)|(\/\/.*$)/);
    const comment = commentMatch?.[0];
    const base = comment ? line.slice(0, line.indexOf(comment)) : line;
    const tokens = base.split(/(\s+|[{}()[\],.:=])/g).filter((token) => token.length > 0);
    const highlighted = tokens.map((token, index) => {
      const isKeyword = /^(from|import|def|const|await|async|return|function)$/.test(token);
      const isString = /^["'`].*["'`]$/.test(token);
      const isPunctuation = /^[{}()[\],.:=]$/.test(token);
      const className = isKeyword
        ? "text-permit"
        : isString
          ? "text-warning"
          : isPunctuation
            ? "text-secondary"
            : "text-signal";

      return (
        <span key={`${token}-${index}`} className={className}>
          {token}
        </span>
      );
    });

    if (!comment) return highlighted;
    return [
      ...highlighted,
      <span key="comment" className="text-muted">
        {comment}
      </span>
    ];
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActive(tab.label)}
              className={`rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                tab.label === active ? "bg-permit/20 text-permit" : "text-secondary hover:text-signal"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onCopy}
          className="inline-flex items-center rounded-md border border-border px-3 py-1 text-xs text-secondary hover:text-signal"
        >
          {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed">
        <code>
          {current.code.split("\n").map((line, index) => (
            <span key={`${line}-${index}`} className="block">
              {highlightLine(line)}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
