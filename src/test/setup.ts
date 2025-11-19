import { expect, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import * as matchers from "@testing-library/jest-dom/matchers";
import { sql } from "drizzle-orm";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";

// Register happy-dom for component testing
GlobalRegistrator.register();

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Create a fresh DB for this test context
const sqlite = new Database(":memory:");
const testDb = drizzle(sqlite, { schema });

// Mock next/cache globally
mock.module("next/cache", () => ({
    revalidatePath: () => { },
}));

// Mock @/db globally to use the isolated test DB
mock.module("@/db", () => ({
    db: testDb,
}));

// Shared DB setup helper
export async function setupTestDb() {
    await testDb.run(sql`
        CREATE TABLE IF NOT EXISTS lists(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT DEFAULT '#000000',
            icon TEXT,
            slug TEXT NOT NULL UNIQUE,
            created_at INTEGER DEFAULT(strftime('%s', 'now')),
            updated_at INTEGER DEFAULT(strftime('%s', 'now'))
        );
    `);
    await testDb.run(sql`
        CREATE TABLE IF NOT EXISTS tasks(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            list_id INTEGER REFERENCES lists(id),
            title TEXT NOT NULL,
            description TEXT,
            priority TEXT DEFAULT 'none',
            due_date INTEGER,
            is_completed INTEGER DEFAULT 0,
            completed_at INTEGER,
            is_recurring INTEGER DEFAULT 0,
            recurring_rule TEXT,
            parent_id INTEGER REFERENCES tasks(id),
            estimate_minutes INTEGER,
            actual_minutes INTEGER,
            created_at INTEGER DEFAULT(strftime('%s', 'now')),
            updated_at INTEGER DEFAULT(strftime('%s', 'now')),
            deadline INTEGER
        );
    `);
    await testDb.run(sql`
        CREATE TABLE IF NOT EXISTS labels(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT DEFAULT '#000000',
            icon TEXT
        );
    `);
    await testDb.run(sql`
        CREATE TABLE IF NOT EXISTS task_labels(
            task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            label_id INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
            PRIMARY KEY(task_id, label_id)
        );
    `);
    await testDb.run(sql`
        CREATE TABLE IF NOT EXISTS task_logs(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            action TEXT NOT NULL,
            details TEXT,
            created_at INTEGER DEFAULT(strftime('%s', 'now'))
        );
    `);
    await testDb.run(sql`
        CREATE TABLE IF NOT EXISTS reminders(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            remind_at INTEGER NOT NULL,
            is_sent INTEGER DEFAULT 0,
            created_at INTEGER DEFAULT(strftime('%s', 'now'))
        );
    `);
}

export async function resetTestDb() {
    await testDb.run(sql`DELETE FROM task_logs`);
    await testDb.run(sql`DELETE FROM reminders`);
    await testDb.run(sql`DELETE FROM task_labels`);
    await testDb.run(sql`DELETE FROM tasks`);
    await testDb.run(sql`DELETE FROM labels`);
    await testDb.run(sql`DELETE FROM lists`);
}
