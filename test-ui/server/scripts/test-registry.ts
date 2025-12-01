/**
 * Test Registry - Single source of truth for all integration test metadata
 *
 * This replaces the string parsing logic scattered across the codebase.
 * All test definitions, metadata, and execution logic should reference this registry.
 */

export type PackageManager = "npm" | "yarn" | "pnpm";
export type TestType = "direct" | "library";
export type TestStability = "stable" | "experimental";

export interface TestMetadata {
  /** Unique test name (kept as string for CI compatibility) */
  name: string;
  /** Stability: whether this test runs in CI */
  stability: TestStability;
  /** Type of test */
  type: TestType;
  /** Package manager used */
  packageManager: PackageManager;
  /** For direct dependency tests: the integration path */
  integrationPath?: string;
  /** For library tests: the library name */
  libraryName?: string;
  /** For library tests: the app name */
  appName?: string;
  /** Libraries and their versions used in this test */
  dependencies: {
    react?: string;
    [key: string]: string | undefined;
  };
  /** Optional description of what this test validates */
  description?: string;
}

export interface TestRegistry {
  [testName: string]: TestMetadata;
}

// Define all direct dependency tests
const directDependencyTests: TestMetadata[] = [
  // npm direct dependency tests
  {
    name: "npm:integrations/tanstack-start-basic",
    stability: "experimental",
    type: "direct",
    packageManager: "npm",
    integrationPath: "integrations/tanstack-start-basic",
    dependencies: { react: "19" },
  },
  {
    name: "npm:integrations/ts-react16",
    stability: "experimental",
    type: "direct",
    packageManager: "npm",
    integrationPath: "integrations/ts-react16",
    dependencies: { react: "16" },
    description: `This test fails because redux-toolkit 2+ requires React 18+.
    Recharts does support redux-toolkit 1 but both npm and yarn will by default install the most recent peer dependency.
    See https://github.com/recharts/recharts/wiki/How-to-install-Recharts-in-React-16-and-17-project`,
  },
  {
    name: "npm:integrations/ts-react16-overrides",
    stability: "stable",
    type: "direct",
    packageManager: "npm",
    integrationPath: "integrations/ts-react16-overrides",
    dependencies: { react: "16" },
    description:
      'Demonstrates the use of "overrides" to force redux-toolkit 1.x with React 16 in npm project',
  },
  {
    name: "npm:integrations/ts-react16-resolutions",
    stability: "experimental",
    type: "direct",
    packageManager: "npm",
    integrationPath: "integrations/ts-react16-resolutions",
    dependencies: { react: "16" },
    description:
      'Demonstrates the use of "resolutions" to force redux-toolkit 1.x with React 16 in yarn project',
  },
  {
    name: "npm:integrations/ts-react18",
    stability: "stable",
    type: "direct",
    packageManager: "npm",
    integrationPath: "integrations/ts-react18",
    dependencies: { react: "18" },
  },
  {
    name: "npm:integrations/ts-react19",
    stability: "stable",
    type: "direct",
    packageManager: "npm",
    integrationPath: "integrations/ts-react19",
    dependencies: { react: "19" },
  },
  {
    name: "npm:integrations/ts4-react17",
    stability: "stable",
    type: "direct",
    packageManager: "npm",
    integrationPath: "integrations/ts4-react17",
    dependencies: { react: "17" },
  },

  // yarn direct dependency tests
  {
    name: "yarn:integrations/tanstack-start-basic",
    stability: "experimental",
    type: "direct",
    packageManager: "yarn",
    integrationPath: "integrations/tanstack-start-basic",
    dependencies: { react: "19" },
  },
  {
    name: "yarn:integrations/ts-react16",
    stability: "stable",
    type: "direct",
    packageManager: "yarn",
    integrationPath: "integrations/ts-react16",
    dependencies: { react: "16" },
  },
  {
    name: "yarn:integrations/ts-react16-overrides",
    stability: "stable",
    type: "direct",
    packageManager: "yarn",
    integrationPath: "integrations/ts-react16-overrides",
    dependencies: { react: "16" },
  },
  {
    name: "yarn:integrations/ts-react16-resolutions",
    stability: "stable",
    type: "direct",
    packageManager: "yarn",
    integrationPath: "integrations/ts-react16-resolutions",
    dependencies: { react: "16" },
  },
  {
    name: "yarn:integrations/ts-react18",
    stability: "stable",
    type: "direct",
    packageManager: "yarn",
    integrationPath: "integrations/ts-react18",
    dependencies: { react: "18" },
  },
  {
    name: "yarn:integrations/ts-react19",
    stability: "stable",
    type: "direct",
    packageManager: "yarn",
    integrationPath: "integrations/ts-react19",
    dependencies: { react: "19" },
  },
  {
    name: "yarn:integrations/ts4-react17",
    stability: "experimental",
    type: "direct",
    packageManager: "yarn",
    integrationPath: "integrations/ts4-react17",
    dependencies: { react: "17" },
  },
  {
    name: "npm:integrations/ts-skip-lib-check-false",
    stability: "experimental",
    type: "direct",
    packageManager: "npm",
    integrationPath: "integrations/ts-skip-lib-check-false",
    dependencies: {},
    description:
      "Tests typescript with skipLibCheck: false. See https://github.com/recharts/recharts/issues/6664",
  },
  {
    name: "yarn:integrations/ts-skip-lib-check-false",
    stability: "experimental",
    type: "direct",
    packageManager: "yarn",
    integrationPath: "integrations/ts-skip-lib-check-false",
    dependencies: {},
    description:
      "Tests typescript with skipLibCheck: false. See https://github.com/recharts/recharts/issues/6664",
  },
  {
    name: "npm:integrations/ts-react16-skip-lib-check-false",
    stability: "stable",
    type: "direct",
    packageManager: "npm",
    integrationPath: "integrations/ts-react16-skip-lib-check-false",
    dependencies: {},
    description:
      "Tests typescript with skipLibCheck: false, React 16, and redux-toolkit 2. See https://github.com/recharts/recharts/issues/6664",
  },
  {
    name: "yarn:integrations/ts-react16-skip-lib-check-false",
    stability: "stable",
    type: "direct",
    packageManager: "yarn",
    integrationPath: "integrations/ts-react16-skip-lib-check-false",
    dependencies: {},
    description:
      "Tests typescript with skipLibCheck: false, React 16, and redux-toolkit 2. See https://github.com/recharts/recharts/issues/6664",
  },
  {
    name: "pnpm:react19",
    stability: "experimental",
    type: "direct",
    packageManager: "pnpm",
    integrationPath: "integrations/ts-react19",
    dependencies: { react: "19" },
  },
];

// Define all library tests
const libraryTestCombinations = [
  { library: "my-charts-react16", app: "app-react16", reactVersion: "16" },
  { library: "my-charts-react17", app: "app-react16", reactVersion: "17" },
  { library: "my-charts-react17", app: "app-react17", reactVersion: "17" },
  { library: "my-charts-react18", app: "app-react17", reactVersion: "18" },
  { library: "my-charts-react19", app: "app-react17", reactVersion: "19" },
  { library: "my-charts-react18", app: "app-react18", reactVersion: "18" },
  { library: "my-charts-react19", app: "app-react18", reactVersion: "19" },
  { library: "my-charts-react19", app: "app-react19", reactVersion: "19" },
];

// Define which library tests are stable (according to list.js)
const stableLibraryTests = new Set([
  "npm:my-charts-react16:app-react16",
  "npm:my-charts-react17:app-react16",
  "npm:my-charts-react17:app-react17",
  "npm:my-charts-react18:app-react17",
  "npm:my-charts-react18:app-react18",
  "npm:my-charts-react19:app-react18",
  "npm:my-charts-react19:app-react19",
  "yarn:my-charts-react16:app-react16",
  "yarn:my-charts-react17:app-react16",
  "yarn:my-charts-react17:app-react17",
  "yarn:my-charts-react18:app-react17",
  "yarn:my-charts-react18:app-react18",
  "yarn:my-charts-react19:app-react18",
  "yarn:my-charts-react19:app-react19",
]);

const libraryTests: TestMetadata[] = [];
for (const pm of ["npm", "yarn"] as PackageManager[]) {
  for (const combo of libraryTestCombinations) {
    const testName = `${pm}:${combo.library}:${combo.app}`;
    libraryTests.push({
      name: testName,
      stability: stableLibraryTests.has(testName) ? "stable" : "experimental",
      type: "library",
      packageManager: pm,
      libraryName: combo.library,
      appName: combo.app,
      dependencies: { react: combo.reactVersion },
    });
  }
}

// Build the registry
const allTests = [...directDependencyTests, ...libraryTests];
export const testRegistry: TestRegistry = Object.fromEntries(
  allTests.map((test) => [test.name, test]),
);

/**
 * Get metadata for a specific test
 */
export function getTestMetadata(testName: string): TestMetadata | undefined {
  return testRegistry[testName];
}

/**
 * Get all test names, optionally filtered by stability
 */
export function getAllTestNames(stability?: TestStability): string[] {
  if (stability) {
    return allTests
      .filter((test) => test.stability === stability)
      .map((test) => test.name);
  }
  return allTests.map((test) => test.name);
}

/**
 * Get all tests with their metadata, optionally filtered
 */
export function getAllTests(filters?: {
  stability?: TestStability;
  type?: TestType;
  packageManager?: PackageManager;
}): TestMetadata[] {
  let result = allTests;

  if (filters?.stability) {
    result = result.filter((test) => test.stability === filters.stability);
  }
  if (filters?.type) {
    result = result.filter((test) => test.type === filters.type);
  }
  if (filters?.packageManager) {
    result = result.filter(
      (test) => test.packageManager === filters.packageManager,
    );
  }

  return result;
}

/**
 * Check if a test is stable (runs in CI)
 */
export function isStableTest(testName: string): boolean {
  const metadata = getTestMetadata(testName);
  return metadata?.stability === "stable";
}
