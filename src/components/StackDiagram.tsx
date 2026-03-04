import { ArrowDown } from "lucide-react";

const layers = [
  ["AI Applications", "Agents, Copilots, Workflows", false],
  ["Decision Systems", "LLMs, Planning Agents", false],
  ["Authority Layer", "Permission Protocol, Signed Authorization Receipts", true],
  ["Execution Infrastructure", "Cloud, APIs, Databases", false]
] as const;

export function StackDiagram() {
  return (
    <div className="mx-auto max-w-xl">
      {layers.map((layer, index) => (
        <div key={layer[0]} className="text-center">
          <div
            className={`rounded-2xl border p-5 ${
              layer[2] ? "border-permit/60 bg-permit/15 shadow-glow" : "border-border bg-card"
            }`}
          >
            <p className={`text-lg font-semibold ${layer[2] ? "text-permit" : "text-signal"}`}>{layer[0]}</p>
            <p className="mt-1 text-sm text-secondary">{layer[1]}</p>
          </div>
          {index < layers.length - 1 ? <ArrowDown className="mx-auto my-3 h-5 w-5 text-secondary" /> : null}
        </div>
      ))}
    </div>
  );
}
