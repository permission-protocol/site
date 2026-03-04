"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { ReactNode } from "react";

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

  const isTerminal = current.label.toLowerCase() === "terminal";

  const highlightLine = (line: string, lineIndex: number) => {
    if (isTerminal) {
      if (line.startsWith("$ ")) {
        return (
          <>
            <span className="text-[#666]">$ </span>
            <span className="text-[#c8c8c8]">{line.slice(2)}</span>
          </>
        );
      }
      if (line.trimStart().startsWith("✓")) {
        return <span className="text-[#10B981]">{line}</span>;
      }
      if (line.toLowerCase().includes("waiting")) {
        return <span className="text-[#F59E0B]">{line}</span>;
      }
      return <span className="text-[#c8c8c8]">{line}</span>;
    }

    const commentMatch = line.match(/(#.*$)/);
    const comment = commentMatch?.[0];
    const base = comment ? line.slice(0, line.indexOf(comment)) : line;

    const segments = base.split(/(".*?"|'.*?'|`.*?`)/g).filter((token) => token.length > 0);
    const spans: ReactNode[] = [];

    segments.forEach((segment, segmentIndex) => {
      if (/^(".*?"|'.*?'|`.*?`)$/.test(segment)) {
        spans.push(
          <span key={`${lineIndex}-str-${segmentIndex}`} className="text-[#10B981]">
            {segment}
          </span>
        );
        return;
      }

      const tokens = segment.split(/(\s+|[{}()[\],.:=])/g).filter((token) => token.length > 0);
      tokens.forEach((token, tokenIndex) => {
        const prev = tokens[tokenIndex - 1];
        const next = tokens[tokenIndex + 1];
        const isDecorator = token.startsWith("@");
        const isKeyword = /^(from|import|def|return|const|await|async|function)$/.test(token);
        const isFunctionName = prev === "def" || next === "(";
        const isPunctuation = /^[{}()[\],.:=]$/.test(token);

        let className = "text-[#c8c8c8]";
        if (isDecorator || isKeyword) className = "text-[#44aa99]";
        if (isPunctuation) className = "text-[#666]";
        if (isFunctionName) className = "text-[#c8c8c8]";

        spans.push(
          <span key={`${lineIndex}-${segmentIndex}-${token}-${tokenIndex}`} className={className}>
            {token}
          </span>
        );
      });
    });

    if (comment) {
      spans.push(
        <span key={`${lineIndex}-comment`} className="text-[#666]">
          {comment}
        </span>
      );
    }

    return spans;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActive(tab.label)}
              className={`relative rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${
                tab.label === active ? "text-permit" : "text-secondary hover:text-signal"
              }`}
            >
              {tab.label}
              {tab.label === active ? <span className="absolute inset-x-2 -bottom-[7px] h-0.5 rounded-full bg-permit" /> : null}
            </button>
          ))}
        </div>
        <button
          onClick={onCopy}
          className="inline-flex items-center rounded-md border border-border px-3 py-1 text-xs text-secondary hover:bg-permit/10 hover:text-signal"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className={`${isTerminal ? "border-b border-[#1f1f1f] bg-[#111111] px-4 py-2" : "hidden"}`}>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
        </div>
      </div>
      <pre className={`overflow-x-auto p-5 font-mono text-sm leading-relaxed ${isTerminal ? "bg-[#111111]" : ""}`}>
        <code>
          {current.code.split("\n").map((line, index) => (
            <span key={`${line}-${index}`} className="block">
              {highlightLine(line, index)}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
