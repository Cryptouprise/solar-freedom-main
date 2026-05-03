/**
 * Generate a new Admin API key and insert it into the database.
 * Run: node scripts/generate-api-key.mjs <name>
 * 
 * The key is printed once and never stored in plaintext.
 * Save it immediately in a secure location.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const name = process.argv[2] || "Claude Desktop";

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable not set");
  process.exit(1);
}

const db = drizzle(process.env.DATABASE_URL);

// Inline schema definition to avoid TS import issues in .mjs
const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  keyHash: varchar("keyHash", { length: 255 }).notNull().unique(),
  keyPrefix: varchar("keyPrefix", { length: 10 }).notNull(),
  permissions: text("permissions").notNull(),
  active: int("active").default(1).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Generate secure key
const rawKey = `sf_${crypto.randomBytes(32).toString("hex")}`;
const keyPrefix = rawKey.slice(0, 10);
const keyHash = await bcrypt.hash(rawKey, 12);

const permissions = [
  "posts:read",
  "posts:write",
  "posts:delete",
  "companies:read",
  "companies:write",
  "config:read",
  "config:write",
  "keys:manage",
];

await db.insert(apiKeys).values({
  name,
  keyHash,
  keyPrefix,
  permissions: JSON.stringify(permissions),
  active: 1,
});

console.log("\n========================================");
console.log("  ADMIN API KEY GENERATED");
console.log("========================================");
console.log(`  Name:    ${name}`);
console.log(`  Prefix:  ${keyPrefix}...`);
console.log(`  Key:     ${rawKey}`);
console.log("\n  ⚠️  SAVE THIS KEY — it will NOT be shown again");
console.log("\n  Usage:");
console.log(`  curl -H "Authorization: Bearer ${rawKey}" \\`);
console.log(`       https://breakyoursolarcontract.com/api/admin/status`);
console.log("========================================\n");

process.exit(0);
