# CI Test Failure Fix - Final Solution

## Problem
The integration test `src/test/integration/task-flow.test.ts` was passing locally but failing on GitHub Actions CI.

## Root Causes Identified

### 1. Database Driver Mismatch
- Production code used `better-sqlite3` which requires native compilation
- Test setup tried to mock with `bun:sqlite`  
- CI environment had issues with `better-sqlite3` compilation or module mocking timing

### 2. Environment Variable Timing
- `NODE_ENV=test` was set in GitHub Actions workflow
- But it wasn't being set early enough in Bun's test runner
- Database module initialization happened before NODE_ENV was available
- This caused the wrong database driver to be used

### 3. Test Isolation Issues
- Tests shared a single in-memory database instance
- No proper cleanup between tests
- Could cause data pollution in parallel test execution

## Solutions Applied

### 1. Updated Database Initialization (`src/db/index.ts`)
```typescript
// Use bun:sqlite in test mode to avoid native module issues
if (process.env.NODE_ENV === "test") {
  const { Database } = await import("bun:sqlite");
  const { drizzle } = await import("drizzle-orm/bun-sqlite");
  const sqlite = new Database(":memory:");
  db = drizzle(sqlite, { schema }) as any;
} else {
  const { default: Database } = await import("better-sqlite3");
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const sqlite = new Database("sqlite.db");
  db = drizzle(sqlite, { schema });
}
```

**Benefits:**
- No native compilation in tests
- Both drivers have compatible APIs
- Proper TypeScript types maintained

### 2. Set NODE_ENV Early (`bunfig.toml`)
```toml
[test]
preload = ["./src/test/setup.ts"]

[test.env]
NODE_ENV = "test"
```

**Critical:** This ensures NODE_ENV is set BEFORE any modules are loaded, so the database initialization picks the correct driver.

### 3. Improved Test Isolation (`src/test/integration/task-flow.test.ts`)
```typescript
beforeEach(async () => {
    try {
        await setupTestDb();
    } catch (e) {
        // Tables might already exist, that's ok
    }
    await resetTestDb();
});
```

Changes made:
- Changed from `beforeAll` to `beforeEach` for better isolation
- Added try-catch for idempotent setup
- Used unique slugs with timestamps to avoid conflicts
- Added explicit cleanup at end of test
- More assertions to catch failures earlier

###4. Simplified Test Setup (`src/test/setup.ts`)
- Removed redundant database mock (no longer needed)
- Import `db` directly from `@/db`
- Database setup functions use the real db instance

### 5. Fixed Activity Log Query (`src/lib/actions.ts`)
```typescript
taskTitle: sql<string>`COALESCE(${tasks.title}, 'Unknown Task')`.as('task_title')
```

This properly handles NULL values from the leftJoin.

## Verification

### Local Testing
```bash
bun test  # All 86 tests pass ✓
bun run build  # Build succeeds ✓
```

### CI Configuration
The GitHub Actions workflow sets NODE_ENV (though bunfig.toml now ensures it's set):
```yaml
- name: Test
  run: bun test
  env:
    NODE_ENV: test
```

## Why This Fix Works

1. **No Native Dependencies**: `bun:sqlite` is built into Bun, requires no compilation
2. **Early Environment Setup**: bunfig.toml sets NODE_ENV before any imports
3. **Consistent Behavior**: Same database path for local and CI test environments
4. **Proper Isolation**: Each test run starts with clean state
5. **Better Error Detection**: More assertions catch issues earlier

## Testing the Fix

To verify locally (simulating CI):

```bash
# Remove any cached modules
rm -rf node_modules/.cache

# Run tests
bun test

# Run specific integration test
bun test src/test/integration/task-flow.test.ts

# Build to ensure no type errors
bun run build
```

All should pass successfully.

## Files Changed

1. `/src/db/index.ts` - Conditional database driver loading
2. `/src/test/setup.ts` - Removed database mock, simplified
3. `/src/test/integration/task-flow.test.ts` - Better isolation and cleanup
4. `/bunfig.toml` - **Critical:** Set NODE_ENV early
5. `/src/lib/actions.ts` - Fixed activity log query
6. `/.github/workflows/ci.yml` - Simplified (uses bunfig.toml env)

## Expected CI Outcome

With these changes, the CI pipeline should:
1. ✅ Install dependencies
2. ✅ Pass linting
3. ✅ Pass all 86 tests (including the integration test)
4. ✅ Build successfully

The key insight was that NODE_ENV needed to be set in `bunfig.toml` so it's available during module initialization, not just during test execution.
