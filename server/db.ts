import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { exitIntentCaptures, InsertExitIntentCapture, InsertLead, InsertUser, leads, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Lead helpers ──────────────────────────────────────────────────────────────

/**
 * Insert a new lead from a form submission.
 * Returns the inserted lead's auto-incremented id.
 */
export async function insertLead(lead: InsertLead): Promise<number | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert lead: database not available");
    return null;
  }

  try {
    const result = await db.insert(leads).values(lead);
    return (result as unknown as { insertId: number }[])[0]?.insertId ?? null;
  } catch (error) {
    console.error("[Database] Failed to insert lead:", error);
    throw error;
  }
}

/**
 * Fetch all leads ordered by most recent first.
 */
export async function getLeads(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(leads)
    .orderBy(desc(leads.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Update the status of a lead.
 */
export async function updateLeadStatus(
  id: number,
  status: "new" | "contacted" | "qualified" | "closed_won" | "closed_lost"
) {
  const db = await getDb();
  if (!db) return;

  await db.update(leads).set({ status }).where(eq(leads.id, id));
}

/**
 * Mark a lead as having had the GHL webhook sent successfully.
 */
export async function markLeadGhlSent(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(leads).set({ ghlWebhookSent: 1 }).where(eq(leads.id, id));
}

// ─── Exit intent helpers ───────────────────────────────────────────────────────

/**
 * Insert an exit intent email capture.
 */
export async function insertExitIntentCapture(data: InsertExitIntentCapture): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert exit intent capture: database not available");
    return;
  }

  try {
    await db.insert(exitIntentCaptures).values(data);
  } catch (error) {
    console.error("[Database] Failed to insert exit intent capture:", error);
    throw error;
  }
}
