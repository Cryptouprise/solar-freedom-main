import crypto from "node:crypto";

export const PROMPT_ONLY_POLICY_VERSION = "prompt-only-block-v1";

export type PromptOnlyReceipt = {
  schemaVersion: 1;
  receiptId: string;
  automationId: number;
  mode: "simulation";
  outcome: "blocked";
  policyVersion: string;
  reasonCode: "NO_TYPED_TOOL_RUNNER";
  reason: string;
  specSha256: string;
  triggerTaskSha256: string;
  startedAt: string;
  completedAt: string;
  toolCalls: [];
  stateChanges: [];
  evidence: [];
};

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Prompt-only schedules have no authenticated tool runner. They must never
 * convert generated prose into an execution-success record.
 */
export function createPromptOnlyReceipt(input: {
  automationId: number;
  taskUid: string;
  spec: string;
  startedAt: Date;
  completedAt: Date;
}): PromptOnlyReceipt {
  const specSha256 = sha256(input.spec);
  const triggerTaskSha256 = sha256(input.taskUid);
  const receiptId = sha256([
    input.automationId,
    triggerTaskSha256,
    specSha256,
    input.startedAt.toISOString(),
  ].join(":"));

  return {
    schemaVersion: 1,
    receiptId,
    automationId: input.automationId,
    mode: "simulation",
    outcome: "blocked",
    policyVersion: PROMPT_ONLY_POLICY_VERSION,
    reasonCode: "NO_TYPED_TOOL_RUNNER",
    reason: "This schedule contains a prompt but no authenticated, allowlisted tool runner. No external action was attempted.",
    specSha256,
    triggerTaskSha256,
    startedAt: input.startedAt.toISOString(),
    completedAt: input.completedAt.toISOString(),
    toolCalls: [],
    stateChanges: [],
    evidence: [],
  };
}

export function summarizePromptOnlyReceipt(receipt: PromptOnlyReceipt) {
  return `Blocked safely: ${receipt.reason} Evidence receipt ${receipt.receiptId.slice(0, 12)} recorded zero tool calls and zero state changes.`;
}
