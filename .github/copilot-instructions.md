# recharts-integ Repository Guide

## Overview

This repository contains integration tests for the [Recharts](https://github.com/recharts/recharts) charting library. Its primary purpose is to validate that Recharts works correctly across:
- Multiple React versions (16, 17, 18, 19)
- Different TypeScript configurations
- Various package managers (npm, yarn)
- Different dependency resolution strategies
- Redux Toolkit v1 and v2 compatibility

## Architecture

### Core Components

1. **Test Registry** (`test-ui/server/scripts/test-registry.ts`)
   - Single source of truth for all test definitions
   - Contains metadata: test name, stability (stable/experimental), type, package manager, dependencies
   - Replaces string parsing logic that was previously scattered across the codebase
   - Each test includes optional descriptions explaining what it validates

2. **Controllers** (`test-ui/server/scripts/`)
   - `Controller.ts` - Base controller with common operations
   - `NpmController.ts` - npm-specific operations (uses async `exec`)
   - `YarnController.ts` - yarn-specific operations (uses async `exec`)
   - Handle package installation, testing, building, and dependency verification

3. **Test Phases**
   Every test execution goes through 6 sequential phases:
   1. **Clean** - Remove node_modules and package-lock.json
   2. **Set Version** - Replace recharts version in package.json
   3. **Install** - Run npm/yarn install
   4. **Test** - Run npm/yarn test
   5. **Build** - Run npm/yarn build
   6. **Verify** - Check dependency versions match expectations

### Test Types

1. **Direct Dependency Tests** (`integrations/`)
   - Test projects that directly depend on Recharts
   - Located in `integrations/` directory
   - Examples: `ts-react16`, `ts-react18`, `ts-react19`, etc.

2. **Library Tests** (`libraries/` + `apps-3rd-party/`)
   - Two-step tests: first builds a library (`my-charts-react*`) that uses Recharts
   - Then tests an application that consumes that library
   - Validates transitive dependency scenarios

### Test Stability

- **Stable tests** (`isCi: true`) - Run in CI on every commit, expected to pass reliably
- **Experimental tests** (`isCi: false`) - Known to fail or unstable, used for research and debugging

## Key Files and Scripts

### CLI Tools

These CLI tools are called from the main recharts repository on every pull request.
It's important that these are stable and reliable, but we don't use them directly in this recharts-integ repository.

- `list.js` - Lists all available tests (calls test registry)
  - `node list.js` - List all tests
  - `node list.js --ci` - List only CI-stable tests
  - `node list.js --json` - Output as JSON

- `run-test.sh` - Run a single test from command line
  - Usage: `./run-test.sh <test-name> [recharts-version]`
  - Example: `./run-test.sh npm:integrations/ts-react18 3.5.1`

- `pack-and-run.sh` - Pack local Recharts and run test with it
  - Usage: `./pack-and-run.sh <test-name>`
  - Used for testing unreleased changes

- `scripts/run.mts` - Main test execution logic (imported by server)
- `scripts/run-everything.js` - Run all stable tests

### Test UI (Modern Web Interface)

**Location:** `test-ui/`

**Start:** `./start-ui.sh` (opens at http://localhost:3000)

**Architecture:**
- **Frontend:** React + TypeScript + Redux Toolkit + Vite
- **Backend:** Express + WebSocket (TypeScript, runs with Node.js v25)
- **State Management:** Redux with WebSocket middleware for real-time updates

**Features:**
- List all tests with stability badges
- Filter by name, stability ("stable"/"experimental"), package manager
- Run tests individually or in bulk (serial execution)
- Real-time progress tracking with phase-by-phase output
- Collapsible sections for each phase with logs and duration
- Progress bars showing ETA based on historical run times
- Cancel running tests and clear queue
- Persistent results across page reloads (sessionStorage)
- Pack local Recharts from file system
- Fetch and test specific npm versions
- Display Node.js, npm, and yarn versions

**State Management:**
- Redux slices: tests, queue, results, versions, systemInfo
- Selectors for computed values (e.g., ETA calculations in `testDurationSelectors.ts`)
- WebSocket middleware dispatches Redux actions for real-time updates

**Key Files:**
- `test-ui/src/App.tsx` - Main app component
- `test-ui/src/store/` - Redux store, slices, and selectors
- `test-ui/src/components/` - Reusable components
- `test-ui/server/server.ts` - WebSocket server, test execution
- `test-ui/vite.config.ts` - Vite configuration
- `test-ui/nodemon.json` - Auto-restart server on changes

## Important Technical Details

### Environment

!!! IMPORTANT ALWAYS DOUBLE CHECK NODE_ENV WHEN RUNNING TESTS !!!

- Double check that `NODE_ENV` is set to `development` when running tests locally.
- The default in your environment may be `production` or unset so make sure to set it explicitly if needed.

### Node.js Version Requirements

- **Server requires Node.js v22.18++** for native TypeScript support
  - Runs `.ts` files directly without compilation
  - Uses `nodemon` for auto-restart on changes
  - When running locally, ensure appropriate Node.js by calling `node -v`
  - In case the node executable is not available, or it's too old version, try another installation at path: `/opt/homebrew/bin/node`
  - If that fails, ask developer to install Node.js v22.18 or higher and provide its path

### Dependency Resolution Challenges

Recharts has complex peer dependency requirements:
- Supports React 16-19
- Supports Redux Toolkit v1 and v2
- Redux Toolkit v1 supports React 16-18
- Redux Toolkit v2 requires React 18+

**Problem:** Default npm/yarn installs may pull incompatible versions. More details: https://github.com/recharts/recharts/wiki/How-to-install-Recharts-in-React-16-and-17-project

**Solutions tested:**
- npm `overrides` field (works in npm, see `ts-react16-overrides`)
- yarn `resolutions` field (works in yarn, see `ts-react16-resolutions`)

**Node.js version impact:**
- Node v22: overrides work correctly
- Node v24+: Different dependency resolution algorithm, overrides may not work as expected
- Tests document these differences for debugging

### TypeScript Strict Mode

Some tests validate strict TypeScript checking:
- `ts-skip-lib-check-false` - Tests without `skipLibCheck: true`
- Tests that Recharts types work correctly in strict mode
- Example issue: https://github.com/recharts/recharts/issues/6664

### Async Execution

- **Controllers use async `exec`** (not `execSync`) to prevent blocking
- Server handles multiple concurrent WebSocket connections
- Queue processes tests serially (one at a time) to avoid conflicts
- Each test phase runs asynchronously with proper error handling

### Error Handling

When tests fail:
- Capture stdout/stderr from failed commands
- Display full output in UI (not just "command failed")
- Error objects have `stdout` property with actual error messages
- Verify phase fails if any dependency version check fails

## Testing the Test UI

- **Test framework:** Vitest
- **Test location:** `test-ui/test/`
- **Run tests:** `npm test` in `test-ui/`
- **Run type checking:** `npm run check-types` in `test-ui/`
- **Unit tests exist for:**
  - Utility functions (`formatDuration`)
  - Redux selectors (`testDurationSelectors`)
  - Components (using React Testing Library)

## Common Workflows

### Adding a New Test

1. Add test definition to `test-ui/server/scripts/test-registry.ts`
2. Create test directory in `integrations/` or `libraries/`
3. Add package.json and necessary source files
4. Run test via UI or CLI to validate
5. Mark as `stable` when ready for CI

### Debugging a Failing Test

1. Run test in UI to see phase-by-phase output
2. Check which phase fails (install, test, build, verify)
3. Inspect logs for that specific phase
4. Reproduce locally: `cd integrations/<test-name> && npm install && npm test`
5. Check Node.js version compatibility
6. Review dependency resolution (especially for React 16/17 tests)

### Testing Local Recharts Changes

**Option 1 - UI:**
1. Click "Pack from directory" in version dropdown
2. Select local Recharts repo directory
3. Run test with packed version

**Option 2 - CLI:**
```bash
./pack-and-run.sh npm:integrations/ts-react18
```

### Running All Stable Tests (CI simulation)

```bash
node scripts/run-everything.js
```

## CI Integration

- Tests marked `stability: "stable"` run in CI
- GitHub Actions workflows in `.github/workflows/`
- CI uses the same test registry for consistency
- Experimental tests are skipped in CI

## Environment Variables

- `NODE_ENV` - Should be `development` for local development
- Check with server: GET `/api/system-info` returns Node/npm/yarn versions

## Important Notes

- **Never run tests in parallel** - They modify shared directories and would conflict
- **npm overrides** behavior differs between Node.js versions
- **Test queue** must be cleared properly or tests will keep running
- **sessionStorage** preserves results but not queue state across reloads
- **Path expansion:** Server expands `~` in file paths (frontend doesn't)
- **Error messages:** Always include stdout/stderr in error displays

## Future Improvements

- Consider moving shared types to common package
- Extract test registry to standalone module for CLI/UI sharing
- Add more tests for edge cases (e.g., React 16 + Redux Toolkit 2 combinations)
- Improve progress tracking across page reloads
- Add test result history/comparison

## Related Resources

- [Recharts Wiki - React 16/17 Installation Guide](https://github.com/recharts/recharts/wiki/How-to-install-Recharts-in-React-16-and-17-project)
- [Redux Toolkit Peer Dependencies](https://redux-toolkit.js.org/introduction/getting-started#installation)
- [npm overrides](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides)
- [yarn resolutions](https://classic.yarnpkg.com/en/docs/selective-version-resolutions/)
