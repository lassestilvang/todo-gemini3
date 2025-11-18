import { mock } from "bun:test";
import { Database as BunDatabase } from "bun:sqlite";

mock.module("better-sqlite3", () => {
    return {
        default: class Database {
            private db: BunDatabase;

            constructor(filename: string) {
                this.db = new BunDatabase(":memory:");
            }

            prepare(sql: string) {
                const stmt = this.db.prepare(sql);
                return {
                    get: (...args: any[]) => stmt.get(...args),
                    all: (...args: any[]) => stmt.all(...args),
                    run: (...args: any[]) => stmt.run(...args),
                    values: (...args: any[]) => stmt.values(...args),
                    raw: () => ({
                        all: (...args: any[]) => stmt.values(...args),
                        get: (...args: any[]) => stmt.values(...args)[0],
                        run: (...args: any[]) => stmt.run(...args),
                    }),
                };
            }

            transaction<T>(fn: () => T): T {
                return this.db.transaction(fn)() as T;
            }

            exec(sql: string) {
                this.db.exec(sql);
            }
        }
    };
});

mock.module("next/cache", () => ({
    revalidatePath: () => { },
}));
