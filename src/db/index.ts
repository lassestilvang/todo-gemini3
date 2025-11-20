import * as schema from "./schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

// Use bun:sqlite in test mode to match the test setup and avoid native module issues in CI
// At runtime, both drivers have compatible APIs, but we use the better-sqlite3 type for TypeScript
let db: BetterSQLite3Database<typeof schema>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sqliteConnection: any; // Raw SQLite connection for direct access in tests

if (process.env.NODE_ENV === "test") {
    const { Database } = await import("bun:sqlite");
    const { drizzle } = await import("drizzle-orm/bun-sqlite");
    sqliteConnection = new Database(":memory:");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db = drizzle(sqliteConnection, { schema }) as any;
} else if (typeof Bun !== "undefined") {
    const { Database } = await import("bun:sqlite");
    const { drizzle } = await import("drizzle-orm/bun-sqlite");
    sqliteConnection = new Database("sqlite.db");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db = drizzle(sqliteConnection, { schema }) as any;
} else {
    const { default: Database } = await import("better-sqlite3");
    const { drizzle } = await import("drizzle-orm/better-sqlite3");
    sqliteConnection = new Database("sqlite.db");
    db = drizzle(sqliteConnection, { schema });
}

export { db, sqliteConnection };

