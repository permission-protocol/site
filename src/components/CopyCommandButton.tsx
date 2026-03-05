"use client";

import { useState } from "react";
import { Check, Terminal } from "lucide-react";

type CommandOption = {
  id: string;
  command: string;
};

type CopyCommandButtonProps = {
  command?: string;
  commands?: CommandOption[];
  activeCommandId?: string;
};

export function CopyCommandButton({ command, commands, activeCommandId }: CopyCommandButtonProps) {
  const [copied, setCopied] = useState(false);
  const resolvedCommand =
    (commands && commands.length > 0
      ? commands.find((item) => item.id === activeCommandId)?.command ?? commands[0].command
      : command) ?? "";

  const onCopy = async () => {
    if (!resolvedCommand) return;
    await navigator.clipboard.writeText(resolvedCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1000);
  };

  return (
    <button
      onClick={onCopy}
      disabled={!resolvedCommand}
      className="btn-secondary rounded-lg bg-card px-4 py-2 font-mono text-sm"
    >
      {copied ? <Check className="mr-2 h-4 w-4 text-permit" /> : <Terminal className="mr-2 h-4 w-4 text-permit" />}
      {copied ? "Copied" : resolvedCommand}
    </button>
  );
}
