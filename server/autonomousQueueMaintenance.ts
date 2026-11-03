import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { createHash } from "node:crypto";
import {
  agentActions,
  seoChangeLog,
  type AgentAction,
} from "../drizzle/schema";
import { getDb } from "./db";
import { remainingAutonomousBudgetMs } from "./autonomousBudget";
import {
  EXECUTABLE_ACTION_TYPES,
  isExecutable,
  pageCooldownReason,
  resolveBlogSlug,
} from "./agents/executors";

export const QUEUE_MAINTENANCE_LIMITS = {
  scan: 200,
  writes: 50,
  history: 1_000,
  workBudgetMs: 2_000,
} as const;

export type QueueMaintenanceReport = {
  /** Counts describe this bounded window, never the entire backlog. */
  scanned: number;
  eligible: number;
  protected: number;
  duplicatesFound: number;
  superseded: number;
  measurementHeld: number;
  conflicts: number;
  scanLimitReached: boolean;
  historyLimitReached: boolean;
  budgetExhausted: boolean;
  transitionedActionIds: number[];
};

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type Identity = { key: string; payloadHash: string; pagePath: string };
const TARGET_KEYS = ["pageSlug", "slug", "url", "page", "target"];

/** JSON key order is immaterial; strings, array order, types and unknown fields are not. */
function stableJson(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map(
        key =>
          `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Only pristine open typed work is eligible; old advisory/user receipts stay untouched. */
export function isMaintenanceEligible(action: AgentAction): boolean {
  return (
    isExecutable(action.actionType) &&
    (action.status === "approved" ||
      (action.status === "queued" && action.requiresApproval === 0)) &&
    action.startedAt === null &&
    action.completedAt === null &&
    action.result === null &&
    action.errorMessage === null &&
    action.retryCount === 0
  );
}

/**
 * Fail closed on ambiguous targets or payloads. Aliases remain different action
 * types, and prompt instructions remain exact: same URL alone is NOT equivalence.
 * Approval state includes its provenance; cleanup never borrows another approval.
 */
export function queuedActionIdentity(action: AgentAction): Identity | null {
  if (!isMaintenanceEligible(action) || action.actionType === "research_firm")
    return null;
  let payload: Record<string, unknown>;
  try {
    payload = action.payload === null ? {} : JSON.parse(action.payload);
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      return null;
  } catch {
    return null;
  }
  const slug = resolveBlogSlug({
    actionId: action.id,
    actionType: action.actionType,
    agentSlug: action.agentSlug,
    title: action.title,
    description: action.description ?? "",
    payload,
  });
  if (!slug) return null;
  const pagePath = `/blog/${slug}`;
  const normalizedPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => !TARGET_KEYS.includes(key))
  );
  const payloadHash = createHash("sha256")
    .update(
      stableJson({
        actionType: action.actionType,
        pagePath,
        payload: normalizedPayload,
        // These strings are part of the executor's prompt, not disposable labels.
        title: action.title,
        description: action.description ?? "",
        agentSlug: action.agentSlug,
      })
    )
    .digest("hex");
  const key = stableJson({
    pagePath,
    payloadHash,
    status: action.status,
    requiresApproval: action.requiresApproval,
    approvedBy: action.approvedBy,
    approvedAt: action.approvedAt,
    scheduledFor: action.scheduledFor,
  });
  return { key, payloadHash, pagePath };
}

function compareKeepers(a: AgentAction, b: AgentAction): number {
  // Explicit approval is strongest; approval differences are also separate keys.
  const strength = (row: AgentAction) => (row.status === "approved" ? 1 : 0);
  return (
    strength(b) - strength(a) ||
    a.priority.localeCompare(b.priority) ||
    a.createdAt.getTime() - b.createdAt.getTime() ||
    a.id - b.id
  );
}

const SNAPSHOT_KEYS = [
  "actionType",
  "agentSlug",
  "title",
  "description",
  "payload",
  "priority",
  "status",
  "requiresApproval",
  "approvedBy",
  "approvedAt",
  "scheduledFor",
  "startedAt",
  "completedAt",
  "retryCount",
  "result",
  "errorMessage",
  "updatedAt",
] as const;
function snapshotMatches(current: AgentAction, snapshot: AgentAction): boolean {
  return SNAPSHOT_KEYS.every(key => {
    const a = current[key],
      b = snapshot[key];
    return a instanceof Date && b instanceof Date
      ? a.getTime() === b.getTime()
      : a === b;
  });
}

/**
 * No models, deletion, approval changes, retry resets or public writes. All DB
 * work is awaited. Budgets are cooperative admission deadlines, not cancellation
 * of an in-flight transaction. The same stable-row lock as the executor prevents
 * a keeper being claimed while its duplicate is being superseded.
 */
export async function maintainAutonomousQueue(options?: {
  db?: Db;
  /** Supply the already-selected bounded window to avoid another queue query. */
  candidates?: AgentAction[];
  actor?: string;
  deadlineAt?: number;
  workBudgetMs?: number;
  scanLimit?: number;
  maxWrites?: number;
}): Promise<QueueMaintenanceReport> {
  const positive = (n: number, label: string) => {
    if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid ${label}`);
    return n;
  };
  const budget = positive(
    options?.workBudgetMs ?? QUEUE_MAINTENANCE_LIMITS.workBudgetMs,
    "maintenance budget"
  );
  const deadlineAt = Math.min(
    options?.deadlineAt ?? Infinity,
    Date.now() + budget,
    Date.now() + (remainingAutonomousBudgetMs(3_000) ?? Infinity)
  );
  if (!Number.isFinite(deadlineAt))
    throw new Error("Invalid maintenance deadline");
  const scanLimit = Math.min(
    QUEUE_MAINTENANCE_LIMITS.scan,
    Math.floor(
      positive(
        options?.scanLimit ?? QUEUE_MAINTENANCE_LIMITS.scan,
        "scan limit"
      )
    )
  );
  const maxWrites = Math.min(
    QUEUE_MAINTENANCE_LIMITS.writes,
    Math.floor(
      positive(
        options?.maxWrites ?? QUEUE_MAINTENANCE_LIMITS.writes,
        "write limit"
      )
    )
  );
  const report: QueueMaintenanceReport = {
    scanned: 0,
    eligible: 0,
    protected: 0,
    duplicatesFound: 0,
    superseded: 0,
    measurementHeld: 0,
    conflicts: 0,
    scanLimitReached: false,
    historyLimitReached: false,
    budgetExhausted: false,
    transitionedActionIds: [],
  };
  if (Date.now() >= deadlineAt || scanLimit === 0 || maxWrites === 0) {
    report.budgetExhausted = Date.now() >= deadlineAt;
    return report;
  }
  const db = options?.db ?? (await getDb());
  if (!db) throw new Error("Database unavailable");
  const candidates =
    options?.candidates?.slice(0, scanLimit) ??
    (await db
      .select()
      .from(agentActions)
      .where(
        and(
          inArray(agentActions.status, ["queued", "approved"]),
          inArray(agentActions.actionType, EXECUTABLE_ACTION_TYPES),
          isNull(agentActions.startedAt),
          isNull(agentActions.completedAt)
        )
      )
      .orderBy(
        asc(agentActions.priority),
        asc(agentActions.createdAt),
        asc(agentActions.id)
      )
      .limit(scanLimit));
  report.scanned = candidates.length;
  report.scanLimitReached = candidates.length === scanLimit;
  const identities = new Map<number, Identity>();
  const groups = new Map<string, AgentAction[]>();
  for (const action of candidates) {
    const identity = queuedActionIdentity(action);
    if (!identity) {
      report.protected++;
      continue;
    }
    report.eligible++;
    identities.set(action.id, identity);
    const group = groups.get(identity.key) ?? [];
    group.push(action);
    groups.set(identity.key, group);
  }
  const duplicates = new Map<number, AgentAction>();
  for (const group of Array.from(groups.values())) {
    group.sort(compareKeepers);
    for (const duplicate of group.slice(1))
      duplicates.set(duplicate.id, group[0]);
  }
  report.duplicatesFound = duplicates.size;
  if (!identities.size) return report;
  if (Date.now() >= deadlineAt) {
    report.budgetExhausted = true;
    return report;
  }
  const changes = await db
    .select({
      pagesAffected: seoChangeLog.pagesAffected,
      createdAt: seoChangeLog.createdAt,
      measurementDate: seoChangeLog.measurementDate,
      impactMeasured: seoChangeLog.impactMeasured,
      changeType: seoChangeLog.changeType,
    })
    .from(seoChangeLog)
    .orderBy(asc(seoChangeLog.id))
    .limit(QUEUE_MAINTENANCE_LIMITS.history);
  // This preflight only places holds. Missing history can never authorize an edit:
  // resolveTarget still independently verifies the complete history before models.
  report.historyLimitReached =
    changes.length === QUEUE_MAINTENANCE_LIMITS.history;
  const reasons = new Map<string, string | null>();
  for (const { pagePath } of Array.from(identities.values())) {
    if (!reasons.has(pagePath))
      reasons.set(pagePath, pageCooldownReason(pagePath, changes, Date.now()));
  }
  // Duplicates first so a held keeper does not invalidate a duplicate's provenance.
  const ordered = [...candidates].sort(
    (a, b) => Number(duplicates.has(b.id)) - Number(duplicates.has(a.id))
  );
  for (const action of ordered) {
    if (report.transitionedActionIds.length >= maxWrites) break;
    if (Date.now() >= deadlineAt) {
      report.budgetExhausted = true;
      break;
    }
    const identity = identities.get(action.id);
    if (!identity) continue;
    const keeper = duplicates.get(action.id);
    const holdReason = reasons.get(identity.pagePath);
    if (!keeper && !holdReason) continue;
    const reason = keeper
      ? `Superseded by exact equivalent typed action #${keeper.id}; approval, payload and instructions were preserved.`
      : holdReason!;
    const receipt = {
      reason,
      changed: false,
      code: keeper ? "superseded_duplicate" : "pending_measurement_hold",
      ...(keeper ? { duplicateOf: keeper.id } : {}),
      pagePath: identity.pagePath,
      payloadHash: identity.payloadHash,
      maintainedBy: options?.actor ?? "autonomous_queue_maintenance",
    };
    const written = await db.transaction(async tx => {
      await tx
        .select({ id: agentActions.id })
        .from(agentActions)
        .orderBy(asc(agentActions.id))
        .limit(1)
        .for("update");
      const rows = await tx
        .select()
        .from(agentActions)
        .where(
          inArray(
            agentActions.id,
            keeper ? [action.id, keeper.id].sort((a, b) => a - b) : [action.id]
          )
        )
        .orderBy(asc(agentActions.id))
        .for("update");
      const current = rows.find(row => row.id === action.id);
      const retained = keeper && rows.find(row => row.id === keeper.id);
      if (
        !current ||
        !snapshotMatches(current, action) ||
        queuedActionIdentity(current)?.key !== identity.key ||
        (keeper &&
          (!retained ||
            !snapshotMatches(retained, keeper) ||
            queuedActionIdentity(retained)?.key !== identity.key)) ||
        Date.now() >= deadlineAt
      )
        return false;
      const result = await tx
        .update(agentActions)
        .set({
          status: "blocked",
          result: JSON.stringify(receipt),
          completedAt: new Date(),
        })
        .where(
          and(
            eq(agentActions.id, action.id),
            eq(agentActions.status, action.status),
            isNull(agentActions.startedAt),
            isNull(agentActions.completedAt),
            isNull(agentActions.result)
          )
        );
      return Array.isArray(result) && result[0]?.affectedRows === 1;
    });
    if (written) {
      report.transitionedActionIds.push(action.id);
      if (keeper) report.superseded++;
      else report.measurementHeld++;
    } else report.conflicts++;
  }
  report.budgetExhausted ||= Date.now() >= deadlineAt;
  return report;
}
