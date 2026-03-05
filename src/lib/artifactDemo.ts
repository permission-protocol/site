export type ReceiptRecord = {
  receipt_id: string;
  action: string;
  resource: string;
  actor: string;
  approved_by: string;
  policy: string;
  timestamp: string;
  authority_issuer: string;
  signature: string;
};

export const demoReceipt: ReceiptRecord = {
  receipt_id: "8f91c2",
  action: "deploy",
  resource: "billing-service",
  actor: "deploy-bot",
  approved_by: "Sarah Kim",
  policy: "production-deploy",
  timestamp: "2026-03-03T10:14:22Z",
  authority_issuer: "permissionprotocol.com",
  signature: "pp_sig_a8f2e91c..."
};

export const replayAuthorizedEvents = [
  {
    timestamp: "10:14:12",
    title: "Agent proposes action",
    detail: "deploy billing-service",
    subDetail: "Agent: deploy-bot",
    tone: "teal"
  },
  {
    timestamp: "10:14:13",
    title: "Permission Protocol evaluates",
    detail: "Policy: production-deploy",
    subDetail: "Risk tier: standard",
    tone: "teal"
  },
  {
    timestamp: "10:14:14",
    title: "Human approval required",
    detail: "Approval link sent to sarah.kim",
    subDetail: "Waiting for authorization...",
    tone: "amber"
  },
  {
    timestamp: "10:14:42",
    title: "Approved by Sarah Kim",
    detail: 'Via: approval link',
    subDetail: 'Comment: "Approved for Q1 release"',
    tone: "green"
  },
  {
    timestamp: "10:14:43",
    title: "Authority receipt issued",
    detail: "Receipt: pp_r_8f91c2",
    subDetail: "View receipt ->",
    tone: "green"
  },
  {
    timestamp: "10:14:44",
    title: "Deployment executed",
    detail: "billing-service deployed to production",
    subDetail: "",
    tone: "green",
    final: true
  }
] as const;

export const replayBlockedEvents = [
  {
    timestamp: "10:14:12",
    title: "Agent proposes action",
    detail: "delete_database()",
    subDetail: "Agent: cleanup-bot",
    tone: "teal"
  },
  {
    timestamp: "10:14:13",
    title: "Permission Protocol blocks action",
    detail: "No authority receipt present",
    subDetail: "Policy violation: destructive-ops-require-approval",
    tone: "red"
  },
  {
    timestamp: "10:14:13",
    title: "ACTION BLOCKED",
    detail: "No receipt. No execution.",
    subDetail: "",
    tone: "red",
    blocked: true
  }
] as const;

export const toTechnicalJson = (receiptId: string) => ({
  ...demoReceipt,
  receipt_id: receiptId,
  raw_proof: {
    signature_algorithm: "Ed25519",
    key_id: "pp_key_2026_03",
    authority_chain: ["Permission Protocol Root"]
  }
});
