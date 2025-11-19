# CI Test Failure Fix

## Problem

The integration test `src/test/integration/task-flow.test.ts` was passing locally but failing on GitHub Actions CI.

## Root Cause

The issue was caused by a mismatch in database drivers between local and CI environments:

1. **Production code** (`src/db/index.ts`) used `better-sqlite3`, which requires native compilation
2. **Test setup** (`src/test/setup.ts`) created a mock using `bun:sqlite` and tried to override the `@/db` module
3. In the CI environment (Ubuntu), `better-sqlite3` likely had compilation issues or was initialized before the mock could take effect
4. Module mocking timing issues could cause the real database to be imported before the mock was set up

## Solution

### 1. Updated `src/db/index.ts`

Changed the database initialization to use `bun:sqlite` when `NODE_ENV=test`:

```typescript
// Use bun:sqlite in test mode to avoid native module issues
if (process.env.NODE_ENV === "test") {
  const { Database } = await import("bun:sqlite");
  const { drizzle } = await import("drizzle-orm/bun-sqlite");
  const sqlite = new Database(":memory:");
  db = drizzle(sqlite, { schema });
} else {
  const { default: Database } = await import("better-sqlite3");
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const sqlite = new Database("sqlite.db");
  db = drizzle(sqlite, { schema });
}
```

Benefits:
- No native compilation required in CI
- Eliminates module mocking complexity
- Both local and CI use the same code path
- In-memory database is created automatically in test mode

### 2. Simplified `src/test/setup.ts`

Removed the database mock since it's no longer needed:

```typescript
// Before:
const testDb = drizzle(sqlite, { schema });
mock.module("@/db", () => ({ db: testDb }));

// After:
import { db } from "@/db"; // Just import the real db
```

The `setupTestDb()` and `resetTestDb()` functions now use the imported `db` directly.

## Verification

### Local Testing
```bash
NODE_ENV=test bun test
# All 86 tests pass
```

### CI Environment
The GitHub Actions workflow already sets `NODE_ENV=test`:

```yaml
- name: Test
  run: bun run test
  env:
    NODE_ENV: test
```

## Why This Works

1. **No native dependencies in tests**: `bun:sqlite` is built into Bun, no compilation needed
2. **Consistent behavior**: Same database driver between test setup and production code in test mode
3. **No module mocking race conditions**: The production code itself handles test mode
4. **Proper isolation**: In-memory database is created fresh for tests

## Testing the Fix

To verify the fix works both locally and in CI:

```bash
# Run locally
bun test

# Run with explicit NODE_ENV (simulates CI)
NODE_ENV=test bun test

# Run the specific integration test
bun test src/test/integration/task-flow.test.ts
```

All tests should pass in all scenarios.
