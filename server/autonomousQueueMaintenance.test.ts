import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import {
  agentActions,
  blogPosts,
  seoChangeLog,
  type AgentAction,
} from "../drizzle/schema";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getAdminBlogPost: vi.fn(),
  llm: vi.fn(),
}));
vi.mock("./db", () => ({
  getDb: mocks.getDb,
  getAdminBlogPost: mocks.getAdminBlogPost,
}));
vi.mock("./agents/agentLLM", () => ({ callAgentLLM: mocks.llm }));

import {
  maintainAutonomousQueue,
  queuedActionIdentity,
  QUEUE_MAINTENANCE_LIMITS,
} from "./autonomousQueueMaintenance";
import {
  runQueuedActionExecutions,
  executeQueuedAction,
} from "./agents/executors";
import { withAutonomousBudget } from "./autonomousBudget";

const NOW = new Date("2026-11-03T01:00:00Z");
const PATH = "/blog/adt-solar-complaints";
const DAY = 86_400_000;
function action(overrides: Partial<AgentAction> = {}): AgentAction {
  return {
    id: 1,
    agentSlug: "seo_intel",
    priority: "p3",
    title: "Improve snippet",
    description: "Keep it factual",
    actionType: "meta_rewrite",
    payload: JSON.stringify({ url: PATH, options: { a: 1, b: true } }),
    status: "queued",
    result: null,
    requiresApproval: 0,
    approvedBy: null,
    approvedAt: null,
    errorMessage: null,
    retryCount: 0,
    scheduledFor: null,
    startedAt: null,
    completedAt: null,
    durationMs: null,
    costUsd: "0",
    createdAt: new Date(NOW.getTime() - DAY),
    updatedAt: NOW,
    ...overrides,
  };
}

/** Strictly bounded in-memory query builder; predicates are compiled from real Drizzle SQL. */
function matches(where: any, row: any): boolean {
  if (!where) return true;
  const compiled = new MySqlDialect().sqlToQuery(where);
  let parameter = 0;
  const atoms = compiled.sql.split(/\s+(?:and|or)\s+/i).map((part: string) => {
    const name = part.match(/`agentActions`\.`([^`]+)`/)?.[1];
    if (!name) throw new Error(`Unexpected test predicate: ${compiled.sql}`);
    const count = (part.match(/\?/g) ?? []).length;
    const values = compiled.params.slice(parameter, (parameter += count));
    if (part.includes(" is null")) return row[name] === null;
    if (part.includes(" in ")) return values.includes(row[name]);
    if (part.includes(" = ")) return values[0] === row[name];
    throw new Error(`Unsupported test predicate: ${part}`);
  });
  // Only maintenance/claim UPDATE and exact-ID predicates are evaluated by this
  // focused harness; readyActionPredicate is covered by the existing SQL suite.
  return atoms.every(Boolean);
}
function memoryDb(actions: AgentAction[], changes: any[] = []) {
  const state = {
    actions,
    changes,
    queries: [] as any[],
    updates: [] as any[],
    beforeTransaction: undefined as undefined | (() => void),
    transactions: 0,
  };
  const db: any = {
    select: (fields?: any) => {
      let table: any,
        where: any,
        take = Infinity;
      const query: any = {
        from(value: any) {
          table = value;
          return query;
        },
        where(value: any) {
          where = value;
          return query;
        },
        orderBy() {
          return query;
        },
        limit(value: number) {
          take = value;
          return query;
        },
        for() {
          return query;
        },
        then(resolve: any, reject: any) {
          state.queries.push({ table, where, take });
          let rows: any[] =
            table === agentActions
              ? state.actions
              : table === seoChangeLog
                ? state.changes
                : [];
          // The batch's compound readiness is already covered by real SQL tests.
          const isBatchSelection = table === agentActions && take === 200;
          rows = rows.filter(row =>
            isBatchSelection
              ? (row.status === "approved" ||
                  (row.status === "queued" && row.requiresApproval === 0)) &&
                row.startedAt === null &&
                row.completedAt === null &&
                (row.scheduledFor === null || row.scheduledFor <= NOW) &&
                [
                  "meta_rewrite",
                  "meta_fix",
                  "faq_addition",
                  "internal_link",
                ].includes(row.actionType)
              : matches(where, row)
          );
          return Promise.resolve(
            rows.slice(0, take).map(row => ({ ...row }))
          ).then(resolve, reject);
        },
      };
      return query;
    },
    update(table: any) {
      return {
        set(values: any) {
          return {
            async where(where: any) {
              if (table !== agentActions)
                throw new Error("Unexpected public update in test");
              const rows = state.actions.filter(row => matches(where, row));
              state.updates.push({ values, where });
              rows.forEach(row => Object.assign(row, values));
              return [{ affectedRows: rows.length }];
            },
          };
        },
      };
    },
    async transaction(work: any) {
      state.transactions++;
      state.beforeTransaction?.();
      state.beforeTransaction = undefined;
      return work(db);
    },
  };
  return { db, state };
}
function change() {
  return {
    id: 1,
    pagesAffected: JSON.stringify([PATH]),
    createdAt: new Date(NOW.getTime() - 20 * DAY),
    measurementDate: null,
    impactMeasured: 0,
    changeType: "meta_updated",
  };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
});
afterEach(() => vi.useRealTimers());

describe("conservative exact typed action identity", () => {
  it("normalizes canonical URL spellings, target keys and JSON object key order only", () => {
    const a = action();
    const b = action({
      id: 2,
      payload: JSON.stringify({
        options: { b: true, a: 1 },
        slug: "ADT-SOLAR-COMPLAINTS",
      }),
    });
    const c = action({
      id: 3,
      payload: JSON.stringify({
        pageSlug: `https://www.breakyoursolarcontract.com${PATH}/?utm=x#fragment`,
        options: { a: 1, b: true },
      }),
    });
    expect(queuedActionIdentity(a)?.key).toBe(queuedActionIdentity(b)?.key);
    expect(queuedActionIdentity(a)?.key).toBe(queuedActionIdentity(c)?.key);
    expect(queuedActionIdentity(a)?.payloadHash).toMatch(/^[a-f0-9]{64}$/);
  });
  it.each([
    { actionType: "meta_fix" },
    { title: "Different instructions" },
    { description: "Different facts" },
    { agentSlug: "revenue_intel" },
    { status: "approved" as const },
    { requiresApproval: 1 },
    { approvedBy: "human" },
    { approvedAt: NOW },
    { scheduledFor: NOW },
    { payload: JSON.stringify({ url: PATH, options: { a: "1", b: true } }) },
    {
      payload: JSON.stringify({
        url: PATH,
        options: { a: 1, b: true },
        unknown: false,
      }),
    },
    {
      payload: JSON.stringify({
        url: "/blog/another-page",
        options: { a: 1, b: true },
      }),
    },
  ])(
    "protects different payload/instructions/approval/schedule %j",
    difference => {
      expect(queuedActionIdentity(action(difference))?.key).not.toBe(
        queuedActionIdentity(action())?.key
      );
    }
  );
  it("never collapses approval timestamps or scheduled dates", () => {
    expect(queuedActionIdentity(action({ approvedAt: NOW }))?.key).not.toBe(
      queuedActionIdentity(action({ approvedAt: new Date(NOW.getTime() + 1) }))
        ?.key
    );
  });
  it.each([
    { actionType: "publish_content" },
    { actionType: "recommend_outreach" },
    { actionType: "unknown_user_task" },
    { actionType: "research_firm" },
    { status: "blocked" as const },
    { status: "failed" as const },
    { startedAt: NOW },
    { completedAt: NOW },
    { result: "Original user receipt" },
    { errorMessage: "Old failure" },
    { retryCount: 1 },
    { payload: "[1]" },
    { payload: "bad json" },
    { payload: JSON.stringify({ url: "https://foreign.test" + PATH }) },
    { payload: JSON.stringify({ url: PATH, slug: "another-page" }) },
  ])(
    "leaves non-pristine, untyped or ambiguous item protected %j",
    difference => {
      expect(queuedActionIdentity(action(difference))).toBeNull();
    }
  );
});

describe("bounded idempotent queue maintenance", () => {
  it("supersedes exact duplicates with provenance and preserves history; rerun is a no-op", async () => {
    const original = action();
    const duplicate = action({ id: 2, createdAt: NOW });
    const { db, state } = memoryDb([original, duplicate]);
    const first = await maintainAutonomousQueue({
      db,
      candidates: state.actions,
    });
    expect(first).toMatchObject({
      scanned: 2,
      superseded: 1,
      measurementHeld: 0,
      conflicts: 0,
    });
    expect(state.actions).toHaveLength(2);
    expect(original.status).toBe("queued");
    expect(duplicate.status).toBe("blocked");
    expect(duplicate.startedAt).toBeNull();
    expect(duplicate.title).toBe(original.title);
    expect(JSON.parse(duplicate.result!)).toMatchObject({
      duplicateOf: 1,
      code: "superseded_duplicate",
      changed: false,
      pagePath: PATH,
    });
    const second = await maintainAutonomousQueue({
      db,
      candidates: state.actions,
    });
    expect(second.superseded).toBe(0);
    expect(state.updates).toHaveLength(1);
  });
  it("preserves approved work and never transfers approval across groups", async () => {
    const approved = action({
      id: 2,
      status: "approved",
      requiresApproval: 1,
      approvedBy: "human",
      approvedAt: NOW,
    });
    const approvedCopy = action({
      id: 3,
      status: "approved",
      requiresApproval: 1,
      approvedBy: "human",
      approvedAt: NOW,
      createdAt: NOW,
    });
    const gated = action({ id: 4, requiresApproval: 1 });
    const { db, state } = memoryDb([action(), approved, approvedCopy, gated]);
    const report = await maintainAutonomousQueue({
      db,
      candidates: state.actions,
    });
    expect(report.superseded).toBe(1);
    expect(approved.status).toBe("approved");
    expect(approved.approvedBy).toBe("human");
    expect(gated.status).toBe("queued");
    expect(JSON.parse(approvedCopy.result!).duplicateOf).toBe(2);
    expect(state.actions[0].status).toBe("queued");
  });
  it("protects untyped/user/advisory items even when old and superficially identical", async () => {
    const candidates = [
      action({ actionType: "unknown_user_task" }),
      action({ id: 2, actionType: "unknown_user_task" }),
      action({ id: 3, actionType: "content_gap" }),
      action({ id: 4, result: "Owner note" }),
    ];
    const before = structuredClone(candidates);
    const { db, state } = memoryDb(candidates);
    expect((await maintainAutonomousQueue({ db, candidates })).protected).toBe(
      4
    );
    expect(state.actions).toEqual(before);
    expect(state.updates).toHaveLength(0);
  });
  it.each(["duplicate", "keeper"])(
    "ignores %s changed after planning rather than overwriting approval",
    async target => {
      const { db, state } = memoryDb([
        action(),
        action({ id: 2, createdAt: NOW }),
      ]);
      state.beforeTransaction = () =>
        Object.assign(state.actions[target === "keeper" ? 0 : 1], {
          approvedBy: "human",
        });
      const report = await maintainAutonomousQueue({
        db,
        candidates: state.actions.map(row => ({ ...row })),
      });
      expect(report).toMatchObject({ superseded: 0, conflicts: 1 });
      expect(state.updates).toHaveLength(0);
    }
  );
  it("places all typed aliases on a pending measurement hold without spending an execution slot", async () => {
    const { db, state } = memoryDb(
      [action(), action({ id: 2, actionType: "faq_addition" })],
      [change()]
    );
    mocks.getDb.mockResolvedValue(db);
    const report = await runQueuedActionExecutions({ workBudgetMs: 24_000 });
    expect(report).toMatchObject({
      executed: 0,
      changed: 0,
      maintenance: { measurementHeld: 2 },
    });
    for (const row of state.actions) {
      expect(row.status).toBe("blocked");
      expect(JSON.parse(row.result!)).toMatchObject({
        code: "pending_measurement_hold",
        changed: false,
      });
      expect(JSON.parse(row.result!).reason).toContain(
        "unmeasured public change"
      );
    }
    expect(
      (await runQueuedActionExecutions({ workBudgetMs: 24_000 })).considered
    ).toBe(0);
    expect(mocks.llm).not.toHaveBeenCalled();
  });
  it("records duplicateOf before separately holding its keeper", async () => {
    const { db, state } = memoryDb(
      [action(), action({ id: 2, createdAt: NOW })],
      [change()]
    );
    const report = await maintainAutonomousQueue({
      db,
      candidates: state.actions,
    });
    expect(report).toMatchObject({ superseded: 1, measurementHeld: 1 });
    expect(JSON.parse(state.actions[1].result!).duplicateOf).toBe(1);
    expect(JSON.parse(state.actions[0].result!).code).toBe(
      "pending_measurement_hold"
    );
  });
  it("enforces both scan and transition caps", async () => {
    const { db, state } = memoryDb(
      Array.from({ length: 250 }, (_, i) => action({ id: i + 1 }))
    );
    const report = await maintainAutonomousQueue({
      db,
      candidates: state.actions,
      maxWrites: 3,
    });
    expect(report.scanned).toBe(QUEUE_MAINTENANCE_LIMITS.scan);
    expect(report.scanLimitReached).toBe(true);
    expect(report.superseded).toBe(3);
    expect(state.updates).toHaveLength(3);
  });
  it("does not query or write after an exhausted work budget", async () => {
    const { db, state } = memoryDb([action(), action({ id: 2 })]);
    const report = await maintainAutonomousQueue({ db, workBudgetMs: 0 });
    expect(report.budgetExhausted).toBe(true);
    expect(state.queries).toHaveLength(0);
    expect(state.transactions).toBe(0);
  });
  it("stops admitting transitions at the cooperative deadline and awaits the transaction", async () => {
    const { db, state } = memoryDb([
      action(),
      action({ id: 2 }),
      action({ id: 3 }),
    ]);
    state.beforeTransaction = () => vi.setSystemTime(NOW.getTime() + 2_001);
    const report = await maintainAutonomousQueue({
      db,
      candidates: state.actions,
    });
    expect(report.budgetExhausted).toBe(true);
    expect(report.superseded).toBe(0);
    expect(state.transactions).toBe(1);
    expect(state.updates).toHaveLength(0);
  });
  it("can skip tick maintenance when the dispatcher schedules it independently", async () => {
    const { db, state } = memoryDb([action()]);
    mocks.getDb.mockResolvedValue(db);
    const report = await runQueuedActionExecutions({
      maintenance: false,
      workBudgetMs: 1,
    });
    expect(report.maintenance).toBeUndefined();
    expect(report.deferredForBudget).toBe(1);
    expect(state.queries.some(query => query.table === seoChangeLog)).toBe(
      false
    );
  });
});

// Short-budget execution uses the real executor up to its modeled no-op proposal.
// The existing SQL suite covers the full atomic page mutation/rollback path.
describe("short awaited invocation model budgets", () => {
  function executionDb() {
    const row = action();
    const post = {
      id: 10,
      slug: "adt-solar-complaints",
      published: 1,
      canonicalUrl: null,
      metaTitle: "ADT Solar Complaints: Homeowner Options",
      title: "ADT Solar Complaints",
      metaDescription:
        "Explore common solar contract questions and review the documents homeowners can organize before choosing their next steps.",
      content: "<p>Solar contract terms vary. Review your documents.</p>",
      excerpt: "",
      faqItems: "[]",
    };
    const receipt: any[] = [];
    const db: any = {
      select() {
        let table: any, where: any;
        const q: any = {
          from(t: any) {
            table = t;
            return q;
          },
          where(w: any) {
            where = w;
            return q;
          },
          orderBy() {
            return q;
          },
          limit() {
            return q;
          },
          for() {
            return q;
          },
          then(resolve: any, reject: any) {
            let rows: any[] =
              table === blogPosts
                ? [post]
                : table === seoChangeLog
                  ? []
                  : [row];
            if (table === agentActions && where) {
              const sql = new MySqlDialect().sqlToQuery(where);
              if (sql.params.includes("running") && row.status !== "running")
                rows = [];
            }
            return Promise.resolve(rows.map(value => ({ ...value }))).then(
              resolve,
              reject
            );
          },
        };
        return q;
      },
      update() {
        return {
          set(values: any) {
            return {
              async where() {
                receipt.push(values);
                Object.assign(row, values);
                return [{ affectedRows: 1 }];
              },
            };
          },
        };
      },
      async transaction(work: any) {
        return work(db);
      },
    };
    mocks.getDb.mockResolvedValue(db);
    mocks.llm.mockResolvedValue({
      content: JSON.stringify({
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
      }),
    });
    return { row, receipt };
  }
  it("passes <=16 seconds and no fallback for the SEO model inside the 24-second ALS invocation", async () => {
    executionDb();
    const result = await withAutonomousBudget(
      { jobId: 1, deadlineAt: NOW.getTime() + 24_000 },
      () => executeQueuedAction(1, "durable_dispatcher")
    );
    expect(result.status).toBe("completed");
    expect(result.changed).toBe(false);
    expect(mocks.llm).toHaveBeenCalledWith(
      expect.objectContaining({
        agentSlug: "seo_intel",
        allowFallback: false,
        executionMode: "scheduled",
        totalTimeoutMs: 16_000,
      })
    );
  });
  it("honors an explicit short work budget including the receipt reserve", async () => {
    executionDb();
    await executeQueuedAction(1, "durable_dispatcher", {
      workBudgetMs: 10_000,
    });
    expect(mocks.llm.mock.calls[0][0].totalTimeoutMs).toBe(7_000);
  });
  it("awaits model failure and records failure rather than claiming unfinished success", async () => {
    const { row } = executionDb();
    mocks.llm.mockRejectedValue(
      new Error("Provider aborted on its total budget")
    );
    const result = await withAutonomousBudget(
      { jobId: 1, deadlineAt: NOW.getTime() + 24_000 },
      () => executeQueuedAction(1, "durable_dispatcher")
    );
    expect(result.status).toBe("failed");
    expect(row.status).toBe("failed");
    expect(result.summary).toContain("Provider aborted");
    expect(JSON.parse(row.result!).changed).toBe(false);
  });
});
