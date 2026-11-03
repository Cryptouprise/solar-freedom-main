import { AsyncLocalStorage } from "node:async_hooks";

export type AutonomousInvocation = { jobId: number; deadlineAt: number; pipelineId?: number };
const current = new AsyncLocalStorage<AutonomousInvocation>();
/** Every persisted work step is awaited inside a real HTTP request. Never fire-and-forget. */
export function withAutonomousBudget<T>(invocation: AutonomousInvocation, work: () => Promise<T>): Promise<T> {
  return current.run(invocation, work);
}
export function getAutonomousInvocation(): AutonomousInvocation | undefined { return current.getStore(); }
export function remainingAutonomousBudgetMs(reserveMs = 0): number | undefined {
  const invocation = current.getStore();
  return invocation ? Math.max(0, invocation.deadlineAt - Date.now() - reserveMs) : undefined;
}
