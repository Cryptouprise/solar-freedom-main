import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/mysql2";
import {
  agentActions,
  blogPosts,
  seoChangeLog,
  type AgentAction,
  type SeoChangeLog,
} from "../../drizzle/schema";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getAdminBlogPost: vi.fn(),
  updateBlogPost: vi.fn(),
  llm: vi.fn(),
  updateAction: vi.fn(),
  research: vi.fn(),
}));
vi.mock("../db", () => ({
  getDb: mocks.getDb,
  getAdminBlogPost: mocks.getAdminBlogPost,
  updateBlogPost: mocks.updateBlogPost,
}));
vi.mock("./agentLLM", () => ({ callAgentLLM: mocks.llm }));
vi.mock("./engine", () => ({ updateAction: mocks.updateAction }));
vi.mock("./attorneyResearch", () => ({
  executeAttorneyResearch: mocks.research,
}));

import {
  EXECUTOR_LIMITS,
  executeQueuedAction,
  revertExecutedAction,
  runQueuedActionExecutions,
  resolveBlogSlug,
  pageChangeKey,
  pageCooldownReason,
  normalizeQuestion,
  isActionReady,
  isExecutable,
  readyActionPredicate,
  type ExecutorContext,
} from "./executors";

const NOW = new Date("2026-11-02T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const SLUG = "adt-solar-complaints";
const PATH = `/blog/${SLUG}`;
const META = {
  metaTitle: "ADT Solar Complaints: Homeowner Options",
  metaDescription:
    "Explore common ADT Solar complaints, organize your contract documents, and understand the options homeowners can review before deciding what to do next.",
};
function action(overrides: Partial<AgentAction> = {}): AgentAction {
  return {
    id: 1,
    agentSlug: "seo_intel",
    priority: "p3",
    title: `Improve ${PATH}`,
    description: "",
    actionType: "meta_rewrite",
    payload: JSON.stringify({ url: PATH }),
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
function post(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    slug: SLUG,
    title: "ADT Solar Complaints Guide",
    metaTitle: null,
    metaDescription: null,
    heroImage: null,
    category: null,
    tags: null,
    content:
      "<p>Solar contract terms can vary. Read your solar agreement carefully before making a decision.</p>",
    excerpt: "A guide to homeowner contract questions.",
    readTime: null,
    relatedSlugs: null,
    faqItems: "[]",
    canonicalUrl: `https://breakyoursolarcontract.com${PATH}`,
    published: 1,
    publishedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}
function change(overrides: Partial<SeoChangeLog> = {}): SeoChangeLog {
  return {
    id: 1,
    changeType: "meta_updated",
    title: "Earlier edit",
    description: "Public edit",
    pagesAffected: JSON.stringify([PATH]),
    pageCount: 1,
    beforeSnapshot: "{}",
    afterSnapshot: "{}",
    impactMeasured: 0,
    impactScore: null,
    impactSummary: null,
    impressionsDelta: null,
    clicksDelta: null,
    positionDelta: null,
    measurementDate: null,
    madeBy: "seo_intel",
    relatedActionId: 99,
    createdAt: new Date(NOW.getTime() - DAY),
    updatedAt: NOW,
    ...overrides,
  };
}
function context(
  payload: Record<string, unknown>,
  overrides: Partial<ExecutorContext> = {}
): ExecutorContext {
  return {
    actionId: 1,
    actionType: "meta_rewrite",
    agentSlug: "seo_intel",
    title: "Improve snippet",
    description: "",
    payload,
    ...overrides,
  };
}

// Execute the production Drizzle SQL; no DB socket, credentials, provider or model
// is used. This small interpreter supports only SQL emitted by this executor.
// Unknown syntax fails instead of silently accepting an untested query.
type Row = Record<string, any>;
type BoundToken = { value: unknown };
function tokens(
  expression: string,
  params: unknown[]
): Array<string | BoundToken> {
  let i = 0;
  return (
    expression.match(/`[^`]+`|\?|<=|>=|!=|[=(),.]|[a-z_][a-z_0-9]*|\d+/gi) ?? []
  ).map(token =>
    token === "?"
      ? { value: params[i++] }
      : token.replaceAll("`", "").toLowerCase()
  );
}
function predicate(
  expression: string,
  params: unknown[]
): (row: Row) => boolean {
  const ts = tokens(expression, params);
  let i = 0;
  const peek = () => ts[i];
  const take = (expected?: string) => {
    const token = ts[i++];
    if (expected && token !== expected)
      throw new Error(
        `Expected ${expected}; got ${JSON.stringify(token)} in ${expression}`
      );
    return token;
  };
  const scalar = (): ((row: Row) => any) => {
    const token = take();
    if (typeof token === "object" && token)
      return () =>
        token.value instanceof Date ? token.value.getTime() : token.value;
    if (typeof token !== "string") throw new Error("Invalid SQL scalar");
    let name = token;
    if (peek() === ".") {
      take(".");
      name = take() as string;
    }
    return row => {
      const key = Object.keys(row).find(key => key.toLowerCase() === name);
      const value = key ? row[key] : undefined;
      return value instanceof Date ? value.getTime() : value;
    };
  };
  const primary = (): ((row: Row) => boolean) => {
    if (peek() === "(") {
      take("(");
      const inner = disjunction();
      take(")");
      return inner;
    }
    const left = scalar();
    const op = take();
    if (op === "is") {
      take("null");
      return row => left(row) === null;
    }
    if (op === "in") {
      take("(");
      const values = [scalar()];
      while (peek() === ",") {
        take(",");
        values.push(scalar());
      }
      take(")");
      return row => values.some(value => value(row) === left(row));
    }
    const right = scalar();
    if (op === "=") return row => left(row) === right(row);
    if (op === "<=") return row => left(row) <= right(row);
    if (op === ">=") return row => left(row) >= right(row);
    throw new Error(`Unsupported operator ${op}`);
  };
  const conjunction = (): ((row: Row) => boolean) => {
    let left = primary();
    while (peek() === "and") {
      take("and");
      const right = primary(),
        previous = left;
      left = row => previous(row) && right(row);
    }
    return left;
  };
  const disjunction = (): ((row: Row) => boolean) => {
    let left = conjunction();
    while (peek() === "or") {
      take("or");
      const right = conjunction(),
        previous = left;
      left = row => previous(row) || right(row);
    }
    return left;
  };
  const result = disjunction();
  if (i !== ts.length) throw new Error(`Unparsed SQL: ${expression}`);
  return result;
}
class MemoryMysql {
  tables: Record<string, Row[]> = {
    agentActions: [],
    blogPosts: [],
    seoChangeLog: [],
  };
  queries: Array<{ sql: string; params: unknown[] }> = [];
  zeroClaim = false;
  failLog = false;
  private tail: Promise<void> = Promise.resolve();
  db = drizzle({
    client: {
      getConnection: async () => this.connection(),
      query: (query: any, params: unknown[]) => this.query(query, params),
    } as any,
  });
  private connection() {
    let release = () => {};
    let snapshot: Record<string, Row[]>;
    return {
      query: async (query: any, params: unknown[]) => {
        const sql = typeof query === "string" ? query : query.sql;
        if (sql === "begin") {
          const previous = this.tail;
          this.tail = new Promise<void>(resolve => {
            release = resolve;
          });
          await previous;
          snapshot = structuredClone(this.tables);
          return [{ affectedRows: 0 }, []];
        }
        if (sql === "commit") {
          release();
          return [{ affectedRows: 0 }, []];
        }
        if (sql === "rollback") {
          this.tables = snapshot!;
          release();
          return [{ affectedRows: 0 }, []];
        }
        return this.query(query, params);
      },
      release() {},
    };
  }
  async query(query: any, params: unknown[] = []): Promise<any> {
    const sql = typeof query === "string" ? query : query.sql;
    this.queries.push({ sql, params });
    const table = sql.match(/(?:from|update|into) `([^`]+)`/)?.[1];
    if (!table || !this.tables[table])
      throw new Error(`Unexpected test SQL ${sql}`);
    const where = sql.match(
      / where (.*?)(?: order by | limit | for update|$)/
    )?.[1];
    const whereOffset = where
      ? (sql.slice(0, sql.indexOf(" where ")).match(/\?/g) ?? []).length
      : 0;
    const match = where
      ? predicate(where, params.slice(whereOffset))
      : () => true;
    if (sql.startsWith("select ")) {
      let rows = this.tables[table].filter(match);
      const order = sql.match(/ order by (.*?)(?: limit | for update|$)/)?.[1];
      if (order) {
        const sort = order.split(",").map((part: string) => {
          const m = part.match(/`([^`]+)`(?:\.`([^`]+)`)? (asc|desc)/);
          if (!m) throw new Error("Unsupported sort");
          return { key: m[2] ?? m[1], direction: m[3] === "asc" ? 1 : -1 };
        });
        rows = [...rows].sort((a, b) => {
          for (const { key, direction } of sort) {
            if (a[key] < b[key]) return -direction;
            if (a[key] > b[key]) return direction;
          }
          return 0;
        });
      }
      const limit = sql.match(/ limit (\?|\d+)/)?.[1];
      if (limit)
        rows = rows.slice(
          0,
          limit === "?" ? Number(params[params.length - 1]) : Number(limit)
        );
      const columns = sql
        .slice(7, sql.indexOf(" from "))
        .split(",")
        .map((part: string) => [...part.matchAll(/`([^`]+)`/g)].at(-1)?.[1]);
      return [
        rows.map(row =>
          columns.map((column: string) =>
            row[column] instanceof Date
              ? row[column].toISOString().slice(0, 23).replace("T", " ")
              : (row[column] ?? null)
          )
        ),
        [],
      ];
    }
    if (sql.startsWith("update ")) {
      const set = sql.match(/ set (.*?) where /)?.[1];
      if (!set) throw new Error("Missing SET");
      const columns = set
        .split(",")
        .map((part: string) => part.match(/`([^`]+)` = \?/)?.[1]);
      if (columns.some((column: string) => !column))
        throw new Error("Unsupported SET");
      const rows = this.tables[table].filter(match);
      if (
        table === "agentActions" &&
        params[columns.indexOf("status")] === "running" &&
        this.zeroClaim
      )
        return [{ affectedRows: 0 }, []];
      for (const row of rows)
        columns.forEach((column: string, i: number) => {
          row[column] = params[i];
          if (
            ["startedAt", "completedAt", "updatedAt"].includes(column) &&
            typeof row[column] === "string"
          )
            row[column] = new Date(`${row[column].replace(" ", "T")}Z`);
        });
      return [{ affectedRows: rows.length }, []];
    }
    if (sql.startsWith("insert ")) {
      if (table === "seoChangeLog" && this.failLog)
        throw new Error("Simulated change-log failure");
      const m = sql.match(/\((.*?)\) values \((.*?)\)/);
      if (!m) throw new Error("Unsupported INSERT");
      const cols = Array.from(m[1].matchAll(/`([^`]+)`/g)).map(
        (match: any) => match[1]
      );
      const values = m[2].split(",").map((part: string) => part.trim());
      let i = 0;
      const row: Row = {
        id: this.tables[table].length + 100,
        createdAt: NOW,
        updatedAt: NOW,
        impactMeasured: 0,
      };
      cols.forEach((column: string, j: number) => {
        if (values[j] === "?") row[column] = params[i++];
        else if (values[j] !== "default")
          throw new Error("Unsupported INSERT value");
      });
      this.tables[table].push(row);
      return [{ affectedRows: 1, insertId: row.id }, []];
    }
    throw new Error(`Unexpected SQL ${sql}`);
  }
}
let memory: MemoryMysql;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
  memory = new MemoryMysql();
  memory.tables.agentActions = [action()];
  memory.tables.blogPosts = [post()];
  mocks.getDb.mockResolvedValue(memory.db);
  mocks.getAdminBlogPost.mockResolvedValue(null);
  mocks.llm.mockResolvedValue({ content: JSON.stringify(META) });
});
afterEach(() => vi.useRealTimers());

describe("autopilot executor readiness SQL and atomic state claims", () => {
  it("filters executable approval-ready due rows before LIMIT, then oldest within priority (new advisory rows cannot starve ready work)", async () => {
    memory.tables.agentActions = [
      ...Array.from({ length: 739 }, (_, i) =>
        action({
          id: i + 10,
          actionType: i % 2 ? "content_gap" : "meta_fix",
          requiresApproval: i % 2 ? 0 : 1,
          createdAt: NOW,
        })
      ),
      action({
        id: 2,
        priority: "p2",
        createdAt: new Date(NOW.getTime() - 8 * DAY),
      }),
      action({
        id: 3,
        priority: "p2",
        createdAt: new Date(NOW.getTime() - 7 * DAY),
      }),
      action({
        id: 4,
        priority: "p1",
        scheduledFor: new Date(NOW.getTime() + DAY),
      }),
      action({
        id: 5,
        priority: "p1",
        status: "approved",
        requiresApproval: 1,
        createdAt: new Date(NOW.getTime() - 9 * DAY),
      }),
    ];
    const report = await runQueuedActionExecutions();
    expect(report.considered).toBe(3);
    expect(report.reports[0].actionId).toBe(5);
    const select = memory.queries[0];
    expect(select.sql).toContain("`agentActions`.`actionType` in");
    expect(select.sql).toContain("`agentActions`.`requiresApproval` = ?");
    expect(select.sql.indexOf(" where ")).toBeLessThan(
      select.sql.indexOf(" limit ")
    );
    expect(select.sql).toContain(
      "order by `agentActions`.`priority` asc, `agentActions`.`createdAt` asc, `agentActions`.`id` asc"
    );
  });
  it("picks the oldest same-priority action before a newer alias", async () => {
    memory.tables.agentActions = [
      action({ id: 8 }),
      action({ id: 3, createdAt: new Date(NOW.getTime() - 8 * DAY) }),
    ];
    expect((await runQueuedActionExecutions()).reports[0].actionId).toBe(3);
  });
  it.each([
    "completed",
    "running",
    "rejected",
    "failed",
    "blocked",
    "escalated",
  ] as const)("does not overwrite %s on manual rerun", async status => {
    const original = action({ status, result: "Existing receipt" });
    memory.tables.agentActions = [original];
    expect((await executeQueuedAction(1, "admin:reviewer")).changed).toBe(
      false
    );
    expect(memory.tables.agentActions[0]).toEqual(original);
    expect(mocks.llm).not.toHaveBeenCalled();
    expect(memory.queries.some(query => query.sql.startsWith("update"))).toBe(
      false
    );
  });
  it("preserves approval gate even for reviewed actor; approved ready actions remain executable", async () => {
    memory.tables.agentActions = [action({ requiresApproval: 1 })];
    expect((await executeQueuedAction(1, "admin:reviewer")).status).toBe(
      "blocked"
    );
    expect(mocks.llm).not.toHaveBeenCalled();
    memory.tables.agentActions[0].status = "approved";
    expect((await executeQueuedAction(1, "admin:reviewer")).changed).toBe(true);
  });
  it("does not reset previously attempted actions even if externally requeued/approved", async () => {
    memory.tables.agentActions = [
      action({ status: "approved", startedAt: NOW, retryCount: 2 }),
    ];
    expect((await executeQueuedAction(1, "admin:reviewer")).changed).toBe(
      false
    );
    expect(mocks.llm).not.toHaveBeenCalled();
  });
  it("inspects mysql affectedRows and refuses provider calls after a lost conditional claim", async () => {
    memory.zeroClaim = true;
    expect((await executeQueuedAction(1, "scheduled")).changed).toBe(false);
    expect(mocks.llm).not.toHaveBeenCalled();
    expect(memory.tables.agentActions[0].status).toBe("queued");
    const update = memory.queries.find(query =>
      query.sql.startsWith("update `agentActions`")
    )!;
    expect(update.sql).toContain("`agentActions`.`status` = ?");
    expect(update.sql).toContain("`agentActions`.`requiresApproval` = ?");
    expect(update.sql).toContain("`agentActions`.`startedAt` is null");
  });
  it("readiness helper agrees with SQL for gated/future/attempted actions", () => {
    const inputs = [
      action(),
      action({ requiresApproval: 1 }),
      action({ requiresApproval: 1, status: "approved" }),
      action({ status: "completed" }),
      action({ startedAt: NOW }),
      action({ scheduledFor: new Date(NOW.getTime() + 1) }),
    ];
    const compiled = memory.db
      .select()
      .from(agentActions)
      .where(readyActionPredicate(NOW))
      .toSQL();
    const expression = compiled.sql.split(" where ")[1];
    const sqlReady = predicate(expression, compiled.params);
    for (const input of inputs)
      expect(sqlReady(input)).toBe(isActionReady(input, NOW));
  });
});

describe("autopilot cooldown and validated targets", () => {
  it("collapses aliases, absolute URLs, query strings and case to the same change key", () => {
    const keys = ["meta_rewrite", "meta_fix", "title_optimization"].map(type =>
      pageChangeKey(
        type,
        `https://breakyoursolarcontract.com/blog/${SLUG.toUpperCase()}?utm=x`
      )
    );
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toBe(`${PATH}:meta_updated`);
    expect(pageChangeKey("faq_addition", PATH)).toBe(
      pageChangeKey("schema_markup", PATH)
    );
    expect(isExecutable("constructor")).toBe(false);
  });
  it("requires 14 full days even with measurement, including the millisecond boundary", () => {
    const record = change({
      createdAt: new Date(NOW.getTime() - 14 * DAY + 1),
      impactMeasured: 1,
      measurementDate: new Date(NOW.getTime() - 7 * DAY),
    });
    expect(pageCooldownReason(PATH, [record], NOW.getTime())).toContain(
      "cooldown"
    );
    record.createdAt = new Date(NOW.getTime() - 14 * DAY);
    expect(pageCooldownReason(PATH, [record], NOW.getTime())).toBeNull();
  });
  it("protects unmeasured experiment windows past 14 days, and rejects invalid early measurements", () => {
    const record = change({ createdAt: new Date(NOW.getTime() - 30 * DAY) });
    expect(pageCooldownReason(PATH, [record], NOW.getTime())).toContain(
      "unmeasured"
    );
    record.impactMeasured = 1;
    record.measurementDate = new Date(record.createdAt.getTime() + DAY);
    expect(pageCooldownReason(PATH, [record], NOW.getTime())).toContain(
      "unmeasured"
    );
    record.measurementDate = new Date(record.createdAt.getTime() + 7 * DAY);
    expect(pageCooldownReason(PATH, [record], NOW.getTime())).toBeNull();
  });
  it("blocks aliases and different change types before LLM on a recently changed URL", async () => {
    memory.tables.seoChangeLog = [change()];
    memory.tables.agentActions = [action({ actionType: "schema_markup" })];
    const report = await executeQueuedAction(1, "admin:reviewer");
    expect(report.summary).toContain("cooldown");
    expect(mocks.llm).not.toHaveBeenCalled();
    expect(memory.tables.blogPosts[0].faqItems).toBe("[]");
  });
  it("cannot bypass cooldown with legacy measured flag but invalid measurement date", async () => {
    memory.tables.seoChangeLog = [
      change({
        createdAt: new Date(NOW.getTime() - 30 * DAY),
        impactMeasured: 1,
        measurementDate: null,
      }),
    ];
    const report = await executeQueuedAction(1, "admin:reviewer");
    expect(report.summary).toContain("unmeasured");
    expect(mocks.llm).not.toHaveBeenCalled();
  });
  it.each([
    { url: "https://evil.test/blog/adt-solar-complaints" },
    { url: "//evil.test/blog/adt-solar-complaints" },
    { url: "/blog/adt-solar-complaints/../../other" },
    { url: 123 },
    { url: PATH, slug: "different-blog" },
  ])("fails closed on invalid or conflicting explicit target %j", payload => {
    expect(
      resolveBlogSlug(context(payload, { title: `Rewrite ${PATH}` }))
    ).toBeNull();
  });
  it.each(["{bad json", "null", "[]", '"string"', "12"])(
    "invalid payload %s cannot fall back to prose or call LLM",
    async payload => {
      memory.tables.agentActions = [action({ payload })];
      expect((await executeQueuedAction(1, "scheduled")).status).toBe(
        "blocked"
      );
      expect(mocks.llm).not.toHaveBeenCalled();
    }
  );
  it.each([
    "Improve https://evil.test/blog/adt-solar-complaints",
    "Improve /blog/adt-solar-complaints/../../other",
    "Compare /blog/adt-solar-complaints with /blog/another-page",
  ])("rejects ambiguous/foreign prose target %s", title => {
    expect(resolveBlogSlug(context({}, { title }))).toBeNull();
  });
  it.each([
    { published: 0 },
    { canonicalUrl: "https://evil.test/blog/adt-solar-complaints" },
  ])("fails closed on invalid public source %j", async overrides => {
    memory.tables.blogPosts = [post(overrides)];
    expect((await executeQueuedAction(1, "scheduled")).status).toBe("blocked");
    expect(mocks.llm).not.toHaveBeenCalled();
  });
});

describe("autopilot FAQ total cap and normalized duplicates", () => {
  const faq = (i: number) => ({
    q: `Question ${i}?`,
    a: "This answer depends on the documents and contract terms; review your agreement carefully.",
  });
  it.each([10, 11, 130])(
    "never calls LLM or deletes existing FAQs at/over cap (%i)",
    async count => {
      const existing = JSON.stringify(
        Array.from({ length: count }, (_, i) => faq(i))
      );
      memory.tables.blogPosts = [post({ faqItems: existing })];
      memory.tables.agentActions = [action({ actionType: "faq_addition" })];
      expect((await executeQueuedAction(1, "scheduled")).status).toBe(
        "blocked"
      );
      expect(mocks.llm).not.toHaveBeenCalled();
      expect(memory.tables.blogPosts[0].faqItems).toBe(existing);
      expect(memory.tables.seoChangeLog).toHaveLength(0);
    }
  );
  it.each(["{bad json", "{}", '[{"q":"Missing answer?"}]'])(
    "malformed stored FAQs %s never trigger model or automatic deletion",
    async faqItems => {
      memory.tables.blogPosts = [post({ faqItems })];
      memory.tables.agentActions = [action({ actionType: "schema_markup" })];
      expect((await executeQueuedAction(1, "scheduled")).status).toBe(
        "blocked"
      );
      expect(mocks.llm).not.toHaveBeenCalled();
      expect(memory.tables.blogPosts[0].faqItems).toBe(faqItems);
    }
  );
  it("enforces remaining capacity after generation and preserves exact rollback storage", async () => {
    const existing = JSON.stringify(
      Array.from({ length: 9 }, (_, i) => faq(i)),
      null,
      2
    );
    memory.tables.blogPosts = [post({ faqItems: existing })];
    memory.tables.agentActions = [action({ actionType: "faq_addition" })];
    mocks.llm.mockResolvedValue({
      content: JSON.stringify({ faq: [faq(10), faq(11), faq(12)] }),
    });
    expect((await executeQueuedAction(1, "scheduled")).changed).toBe(true);
    expect(JSON.parse(memory.tables.blogPosts[0].faqItems)).toHaveLength(10);
    expect(
      JSON.parse(memory.tables.agentActions[0].result).rollback.fields.faqItems
    ).toBe(existing);
    expect(mocks.llm.mock.calls[0][0].messages[1].content).toContain(
      "Add at most 1"
    );
  });
  it("normalizes Unicode width, HTML entities, case and punctuation for existing/proposed duplicates", async () => {
    expect(normalizeQuestion("Ｗhat’s MY contract?")).toBe(
      normalizeQuestion("What&#39;s my contract ???")
    );
    memory.tables.blogPosts = [
      post({
        faqItems: JSON.stringify([{ q: "What is my contract?", a: faq(0).a }]),
      }),
    ];
    memory.tables.agentActions = [action({ actionType: "faq_addition" })];
    mocks.llm.mockResolvedValue({
      content: JSON.stringify({
        faq: [
          { q: "WHAT  is my CONTRACT??", a: faq(0).a },
          { q: "Can I review it?", a: faq(0).a },
          { q: "CAN I review it ??", a: faq(0).a },
        ],
      }),
    });
    expect((await executeQueuedAction(1, "scheduled")).changed).toBe(true);
    expect(JSON.parse(memory.tables.blogPosts[0].faqItems)).toHaveLength(2);
  });
});

describe("autopilot concurrency, batch deadlines and effect receipts", () => {
  it.each([false, true])(
    "concurrent callbacks (different alias=%s) perform one model call and one public mutation",
    async alias => {
      memory.tables.agentActions = [
        action(),
        action({ id: 2, actionType: "title_optimization" }),
      ];
      let release!: (value: any) => void;
      let began!: () => void;
      const started = new Promise<void>(resolve => {
        began = resolve;
      });
      mocks.llm.mockImplementation(() => {
        began();
        return new Promise(resolve => {
          release = resolve;
        });
      });
      const first = executeQueuedAction(1, "callback-A");
      await started;
      const second = await executeQueuedAction(alias ? 2 : 1, "callback-B");
      expect(second.changed).toBe(false);
      expect(mocks.llm).toHaveBeenCalledTimes(1);
      release({ content: JSON.stringify(META) });
      expect((await first).changed).toBe(true);
      expect(memory.tables.seoChangeLog).toHaveLength(1);
      expect(
        memory.queries.filter(query =>
          query.sql.startsWith("update `blogPosts`")
        )
      ).toHaveLength(1);
    }
  );
  it("default and oversized reviewed batches run at most one typed change and leave equivalent actions open", async () => {
    memory.tables.agentActions = [
      action(),
      action({ id: 2, actionType: "meta_fix" }),
      action({ id: 3, actionType: "schema_markup" }),
    ];
    const report = await runQueuedActionExecutions({
      limit: 20,
      actor: "admin:reviewer",
    });
    expect(report.executed).toBe(1);
    expect(report.changed).toBe(1);
    expect(mocks.llm).toHaveBeenCalledTimes(1);
    expect(memory.tables.agentActions[1].status).toBe("queued");
    const retry = await runQueuedActionExecutions();
    expect(retry.changed).toBe(0);
    expect(mocks.llm).toHaveBeenCalledTimes(1);
  });
  it("batch does not start another operation with insufficient remaining callback budget", async () => {
    const report = await runQueuedActionExecutions({
      deadlineAt: NOW.getTime() + EXECUTOR_LIMITS.modelCallBudgetMs - 1,
    });
    expect(report.executed).toBe(0);
    expect(mocks.llm).not.toHaveBeenCalled();
    expect(memory.tables.agentActions[0].status).toBe("queued");
  });
  it("discards late model output without public write, and cannot retry the failed action", async () => {
    mocks.llm.mockImplementation(async () => {
      vi.setSystemTime(NOW.getTime() + EXECUTOR_LIMITS.batchDeadlineMs + 1);
      return { content: JSON.stringify(META) };
    });
    const report = await executeQueuedAction(1, "scheduled");
    expect(report.status).toBe("failed");
    expect(report.changed).toBe(false);
    expect(memory.tables.blogPosts[0].metaTitle).toBeNull();
    expect(memory.tables.seoChangeLog).toHaveLength(0);
    expect((await executeQueuedAction(1, "retry")).changed).toBe(false);
    expect(mocks.llm).toHaveBeenCalledTimes(1);
  });
  it("preserves completed human receipt if execution ownership is lost while generating", async () => {
    mocks.llm.mockImplementation(async () => {
      Object.assign(memory.tables.agentActions[0], {
        status: "completed",
        result: "Human completion receipt",
      });
      return { content: JSON.stringify(META) };
    });
    expect((await executeQueuedAction(1, "scheduled")).changed).toBe(false);
    expect(memory.tables.agentActions[0].result).toBe(
      "Human completion receipt"
    );
    expect(memory.tables.blogPosts[0].metaTitle).toBeNull();
  });
  it("rejects stale target changes during model generation rather than overwriting an editor", async () => {
    mocks.llm.mockImplementation(async () => {
      memory.tables.blogPosts[0].metaTitle = "A human changed this page";
      return { content: JSON.stringify(META) };
    });
    expect((await executeQueuedAction(1, "scheduled")).changed).toBe(false);
    expect(memory.tables.blogPosts[0].metaTitle).toBe(
      "A human changed this page"
    );
    expect(memory.tables.seoChangeLog).toHaveLength(0);
  });
  it("commits exact before/after/rollback receipts and real-public-effect logs together", async () => {
    expect((await executeQueuedAction(1, "scheduled")).changed).toBe(true);
    const receipt = JSON.parse(memory.tables.agentActions[0].result);
    expect(receipt.before).toEqual({ metaTitle: null, metaDescription: null });
    expect(receipt.after).toMatchObject(META);
    expect(receipt.rollback.fields).toEqual({
      metaTitle: null,
      metaDescription: null,
    });
    expect(receipt.changeKey).toBe(`${PATH}:meta_updated`);
    expect(memory.tables.seoChangeLog).toHaveLength(1);
    expect(
      JSON.parse(memory.tables.seoChangeLog[0].afterSnapshot)
    ).toMatchObject(META);
    expect(mocks.updateBlogPost).not.toHaveBeenCalled();
    expect(mocks.updateAction).not.toHaveBeenCalled();
  });
  it("rolls back public mutation if logging fails, retains failure receipt, never retries it", async () => {
    memory.failLog = true;
    const report = await executeQueuedAction(1, "scheduled");
    expect(report.status).toBe("failed");
    expect(report.changed).toBe(false);
    expect(memory.tables.blogPosts[0].metaTitle).toBeNull();
    expect(memory.tables.seoChangeLog).toHaveLength(0);
    expect(memory.tables.agentActions[0].status).toBe("failed");
    expect((await executeQueuedAction(1, "retry")).changed).toBe(false);
  });
  it("no-op metadata does not create a public change log", async () => {
    memory.tables.blogPosts = [post(META)];
    expect((await executeQueuedAction(1, "scheduled")).changed).toBe(false);
    expect(memory.tables.seoChangeLog).toHaveLength(0);
  });
  it("does not execute page creation or off-site work, even on reviewed action", async () => {
    memory.tables.agentActions = [
      action({ status: "approved", actionType: "publish_content" }),
    ];
    expect((await executeQueuedAction(1, "admin:reviewer")).status).toBe(
      "blocked"
    );
    expect(mocks.llm).not.toHaveBeenCalled();
    expect(memory.tables.blogPosts).toHaveLength(1);
  });
  it("attorney review stays source-backed with no public SEO-change log or model call", async () => {
    memory.tables.agentActions = [
      action({
        actionType: "research_firm",
        payload: JSON.stringify({ states: ["Texas"] }),
      }),
    ];
    mocks.research.mockResolvedValue({
      states: ["Texas"],
      saved: 1,
      found: 2,
      duplicates: 1,
    });
    const report = await executeQueuedAction(1, "scheduled");
    expect(report.changed).toBe(true);
    expect(report.summary).toContain("No outreach");
    expect(mocks.research).toHaveBeenCalledWith(["Texas"]);
    expect(mocks.llm).not.toHaveBeenCalled();
    expect(memory.tables.seoChangeLog).toHaveLength(0);
  });
  it("invalid attorney state payload never reaches provider", async () => {
    memory.tables.agentActions = [
      action({
        actionType: "research_firm",
        payload: JSON.stringify({ states: ["Invented State"] }),
      }),
    ];
    expect((await executeQueuedAction(1, "scheduled")).status).toBe("blocked");
    expect(mocks.research).not.toHaveBeenCalled();
  });
  it("restores exact nullable metadata on rollback with real before/after receipt and rejects duplicate rollback", async () => {
    await executeQueuedAction(1, "scheduled");
    expect((await revertExecutedAction(1, "admin:reviewer")).summary).toContain(
      "Reverted"
    );
    expect(memory.tables.blogPosts[0].metaTitle).toBeNull();
    expect(memory.tables.blogPosts[0].metaDescription).toBeNull();
    expect(memory.tables.agentActions[0].status).toBe("rejected");
    expect(memory.tables.seoChangeLog).toHaveLength(2);
    expect(JSON.parse(memory.tables.seoChangeLog[1].beforeSnapshot)).toEqual(
      META
    );
    expect(JSON.parse(memory.tables.seoChangeLog[1].afterSnapshot)).toEqual({
      metaTitle: null,
      metaDescription: null,
    });
    await expect(revertExecutedAction(1, "admin:reviewer")).rejects.toThrow(
      "completed"
    );
    expect((await executeQueuedAction(1, "admin:reviewer")).changed).toBe(
      false
    );
    expect(mocks.llm).toHaveBeenCalledTimes(1);
  });
  it("rollback refuses to overwrite a subsequent human edit", async () => {
    await executeQueuedAction(1, "scheduled");
    memory.tables.blogPosts[0].metaTitle = "Later manual edit";
    await expect(revertExecutedAction(1, "admin:reviewer")).rejects.toThrow(
      "later edit"
    );
    expect(memory.tables.blogPosts[0].metaTitle).toBe("Later manual edit");
    expect(memory.tables.agentActions[0].status).toBe("completed");
  });
  it("rollback transaction never leaves an unlogged public mutation", async () => {
    await executeQueuedAction(1, "scheduled");
    memory.failLog = true;
    await expect(revertExecutedAction(1, "admin:reviewer")).rejects.toThrow();
    expect(memory.tables.blogPosts[0].metaTitle).toBe(META.metaTitle);
    expect(memory.tables.agentActions[0].status).toBe("completed");
  });
});
