import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { spawn } from "child_process";
import * as path from "node:path";
import { fileURLToPath } from "url";
import WebSocket from "ws";
import { WebSocketServer } from "ws";
import * as http from "http";
import { NpmController } from "./scripts/NpmController.ts";
import { YarnController } from "./scripts/YarnController.ts";
import type { Controller } from "./scripts/Controller.ts";
import { TestOutcome } from "./scripts/TestOutcome.ts";
import { getTestMetadata, getAllTests } from "./scripts/test-registry.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const rootDir = path.join(__dirname, "../..");

// Types
interface TestData {
  id: string;
  testName: string;
  rechartsVersion: string;
  status: "running" | "passed" | "failed" | "cancelled";
  output: string;
  error: string;
  startTime: string;
  endTime: string | null;
  exitCode: number | null;
  phases: Phases;
  currentPhase: PhaseName;
}

interface Phase {
  status: "pending" | "running" | "passed" | "failed";
  output: string;
  duration: number | null;
  startTime: string | null;
  endTime: string | null;
}

interface Phases {
  clean: Phase;
  setVersion: Phase;
  install: Phase;
  test: Phase;
  build: Phase;
  verify: Phase;
}

type PhaseName = keyof Phases;

interface QueueItem {
  testName: string;
  rechartsVersion?: string;
  testId: string;
}

interface BroadcastMessage {
  type: string;
  data: any;
}

// Store active test runs
const activeTests = new Map<string, TestData>();

// Test queue for serial execution
const testQueue: QueueItem[] = [];
let isRunningTest = false;
// Note: currentTestAbortController is declared but not currently used for cancellation.
// Test cancellation is handled via shouldCancelQueue flag. Implementing proper abort
// signal support would require refactoring controller methods to accept AbortSignal.
let currentTestAbortController: AbortController | null = null;
let shouldCancelQueue = false;

// WebSocket connections
const clients = new Set<WebSocket>();

wss.on("connection", (ws: WebSocket) => {
  clients.add(ws);
  ws.on("close", () => {
    clients.delete(ws);
  });
});

function broadcast(data: BroadcastMessage): void {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Get list of all tests with stability information
app.get("/api/tests", async (req: Request, res: Response) => {
  try {
    const allTests = getAllTests();

    const testsWithMetadata = allTests.map((metadata) => ({
      name: metadata.name,
      stable: metadata.stability === "stable",
      type: metadata.type,
      packageManager: metadata.packageManager,
      dependencies: metadata.dependencies,
    }));

    res.json({ tests: testsWithMetadata });
  } catch (error: any) {
    console.error("Failed to list tests:", error);
    res.status(500).json({ error: "Failed to list tests: " + error.message });
  }
});

// Helper to run a phase and track its status
async function runPhase(
  phaseName: PhaseName,
  testData: TestData,
  fn: () => TestOutcome | Promise<TestOutcome>,
): Promise<void> {
  // Check if cancelled before starting phase
  if (shouldCancelQueue) {
    throw new Error("Test cancelled");
  }

  const phase = testData.phases[phaseName];
  phase.status = "running";
  phase.startTime = new Date().toISOString();
  testData.currentPhase = phaseName;

  broadcast({
    type: "test-output",
    data: {
      id: testData.id,
      output: "",
      phases: testData.phases,
      currentPhase: testData.currentPhase,
    },
  });

  try {
    const result = await fn();

    console.log("received result", result);

    // Capture output if result has it
    if (result && typeof result === "object") {
      if (result.success !== undefined) {
        phase.status = result.success ? "passed" : "failed";
        if (result.error) {
          phase.output = String(result.error);
        }
      } else {
        phase.status = "passed";
      }
    } else if (typeof result === "string") {
      phase.output = result;
      phase.status = "passed";
    } else {
      phase.status = "passed";
    }
  } catch (error: any) {
    phase.status = "failed";

    // For exec errors, capture stdout/stderr which contains the actual output
    let errorOutput = "";
    if (error.stdout) {
      errorOutput += error.stdout.toString();
    }
    if (error.stderr) {
      errorOutput += error.stderr.toString();
    }
    if (!errorOutput && error.message) {
      errorOutput = error.message;
    }
    if (!errorOutput) {
      errorOutput = String(error);
    }

    phase.output = errorOutput;
    testData.error += `${phaseName} failed: ${error.message}\n`;
  }

  phase.endTime = new Date().toISOString();
  if (phase.startTime) {
    phase.duration =
      new Date(phase.endTime).getTime() - new Date(phase.startTime).getTime();
  }

  broadcast({
    type: "test-output",
    data: {
      id: testData.id,
      output: phase.output || "",
      phases: testData.phases,
      currentPhase: testData.currentPhase,
    },
  });
}

// Helper to verify all single dependency versions
async function verifyAllSingleDependencyVersions(
  controller: Controller,
  testData: TestData,
): Promise<TestOutcome> {
  const dependencies = [
    "recharts",
    "react",
    "react-dom",
    "react-redux",
    "@reduxjs/toolkit",
  ];

  for (const dep of dependencies) {
    try {
      const result = await controller.verifySingleDependencyVersion(dep);
      const output = result.success
        ? `✅ ${dep}: single version verified\n`
        : `❌ ${dep}: ${result.error}\n`;
      testData.phases.verify.output += output;
      if (!result.success) {
        return result; // Return early on first failure
      }
    } catch (error: any) {
      testData.phases.verify.output += `❌ ${dep}: ${error.message}\n`;
      return TestOutcome.fail("verify", error);
    }
  }
  return TestOutcome.ok("verify");
}

function getControllerFactory(
  packageManager: string,
): (projectPath: string) => Controller {
  return (projectPath: string) => {
    if (packageManager === "npm") {
      return new NpmController(projectPath);
    } else if (packageManager === "yarn") {
      return new YarnController(projectPath);
    } else {
      throw new Error(`Unknown package manager: ${packageManager}`);
    }
  };
}

// Get the appropriate controller
function getController(
  testName: string,
  rechartsVersion: string | undefined,
): {
  controller: Controller | null;
  fn: (testData: TestData) => Promise<void>;
} {
  const runDirectDependencyAppTest = (
    controller: Controller,
    version: string,
  ) => {
    return async (testData: TestData) => {
      await runPhase("clean", testData, () => controller.clean());
      await runPhase("setVersion", testData, () =>
        controller.replacePackageJsonVersion("recharts", version),
      );

      await runPhase("install", testData, () => controller.install());
      if (testData.phases.install.status === "failed") {
        return;
      }

      await runPhase("test", testData, () => controller.test());
      await runPhase("build", testData, () => controller.build());
      await runPhase("verify", testData, () =>
        verifyAllSingleDependencyVersions(controller, testData),
      );
    };
  };

  const runLibraryInLibraryTest = (
    libController: Controller,
    appController: Controller,
    version: string,
  ) => {
    return async (testData: TestData) => {
      await runPhase("clean", testData, async () => {
        await libController.clean();
        return await appController.clean();
      });

      await runPhase("setVersion", testData, async () => {
        libController.replacePackageJsonVersion("recharts", version);
        await libController.install();
        await libController.test();
        await libController.build();
        await verifyAllSingleDependencyVersions(libController, testData);
        const myChartsTgzFile = await libController.pack();
        appController.replacePackageJsonVersion("my-charts", myChartsTgzFile);
        return TestOutcome.ok("setVersion");
      });

      await runPhase(
        "install",
        testData,
        async () => await appController.install(),
      );
      if (testData.phases.install.status === "failed") {
        return;
      }

      await runPhase("test", testData, async () => await appController.test());
      await runPhase(
        "build",
        testData,
        async () => await appController.build(),
      );
      await runPhase(
        "verify",
        testData,
        async () =>
          await verifyAllSingleDependencyVersions(appController, testData),
      );
    };
  };

  const version = rechartsVersion || "latest";

  // Try to get metadata from registry
  const metadata = getTestMetadata(testName);

  if (!metadata) {
    throw new Error("Test not found in registry: " + testName);
  }
  // Use registry metadata
  const factory = getControllerFactory(metadata.packageManager);

  if (metadata.type === "library") {
    const libPath = path.join(rootDir, "libraries", metadata.libraryName!);
    const appPath = path.join(rootDir, "apps-3rd-party", metadata.appName!);
    return {
      controller: null,
      fn: runLibraryInLibraryTest(factory(libPath), factory(appPath), version),
    };
  } else if (metadata.type === "direct") {
    const absolutePath = path.join(rootDir, metadata.integrationPath!);
    const controller = factory(absolutePath);
    return {
      controller,
      fn: runDirectDependencyAppTest(controller, version),
    };
  } else {
    throw new Error(`Unknown test type: ${metadata.type}`);
  }
}

// Function to actually run a test
async function executeTest(
  testName: string,
  rechartsVersion: string | undefined,
  testId: string,
): Promise<void> {
  const testData: TestData = {
    id: testId,
    testName,
    rechartsVersion: rechartsVersion || "latest",
    status: "running",
    output: "",
    error: "",
    startTime: new Date().toISOString(),
    endTime: null,
    exitCode: null,
    phases: {
      clean: {
        status: "pending",
        output: "",
        duration: null,
        startTime: null,
        endTime: null,
      },
      setVersion: {
        status: "pending",
        output: "",
        duration: null,
        startTime: null,
        endTime: null,
      },
      install: {
        status: "pending",
        output: "",
        duration: null,
        startTime: null,
        endTime: null,
      },
      test: {
        status: "pending",
        output: "",
        duration: null,
        startTime: null,
        endTime: null,
      },
      build: {
        status: "pending",
        output: "",
        duration: null,
        startTime: null,
        endTime: null,
      },
      verify: {
        status: "pending",
        output: "",
        duration: null,
        startTime: null,
        endTime: null,
      },
    },
    currentPhase: "clean",
  };

  activeTests.set(testId, testData);

  broadcast({
    type: "test-started",
    data: { id: testId, testName },
  });

  try {
    const { fn } = getController(testName, rechartsVersion);
    await fn(testData);

    // Check if cancelled after execution
    if (shouldCancelQueue) {
      testData.status = "cancelled";
      testData.exitCode = -1;
    } else {
      // Determine overall status
      const failedPhases = Object.values(testData.phases).filter(
        (p) => p.status === "failed",
      );
      testData.status = failedPhases.length > 0 ? "failed" : "passed";
      testData.exitCode = failedPhases.length > 0 ? 1 : 0;
    }
  } catch (error: any) {
    if (shouldCancelQueue || error.message === "Test cancelled") {
      testData.status = "cancelled";
      testData.error += `\nTest cancelled`;
      testData.exitCode = -1;
    } else {
      testData.status = "failed";
      testData.error += `\nTest execution error: ${error.message}`;
      testData.exitCode = 1;
    }
  }

  testData.endTime = new Date().toISOString();

  broadcast({
    type: "test-completed",
    data: {
      id: testId,
      status: testData.status,
      exitCode: testData.exitCode,
    },
  });
}

// Process the test queue (non-blocking, processes one test at a time)
async function processQueue(): Promise<void> {
  if (isRunningTest || testQueue.length === 0) {
    return;
  }

  isRunningTest = true;

  const item = testQueue.shift();
  if (item && !shouldCancelQueue) {
    try {
      await executeTest(item.testName, item.rechartsVersion, item.testId);
    } catch (error) {
      console.error("Error executing test:", error);
    }
  }

  isRunningTest = false;

  // Process next item in queue if available and not cancelled
  if (testQueue.length > 0 && !shouldCancelQueue) {
    // Use setImmediate to yield to event loop before processing next test
    setImmediate(() => processQueue());
  } else if (shouldCancelQueue) {
    shouldCancelQueue = false;
  }
}

// Run a single test (adds to queue)
app.post("/api/tests/run", (req: Request, res: Response) => {
  const { testName, rechartsVersion } = req.body;

  if (!testName) {
    return res.status(400).json({ error: "testName is required" });
  }

  const testId = `${testName}-${Date.now()}`;

  // Add to queue
  testQueue.push({ testName, rechartsVersion, testId });

  // Broadcast that test is queued
  broadcast({
    type: "test-queued",
    data: { id: testId, testName, position: testQueue.length },
  });

  // Start processing queue
  processQueue();

  res.json({
    testId,
    message: testQueue.length === 1 ? "Test started" : "Test queued",
    testName,
    queuePosition: testQueue.length,
  });
});

// Get test status
app.get("/api/tests/:testId", (req: Request, res: Response) => {
  const { testId } = req.params;
  const testData = activeTests.get(testId);

  if (!testData) {
    return res.status(404).json({ error: "Test not found" });
  }

  res.json(testData);
});

// Get all active tests
app.get("/api/tests/active/all", (req: Request, res: Response) => {
  const tests = Array.from(activeTests.values());
  res.json({ tests });
});

// Get queue status
app.get("/api/tests/queue", (req: Request, res: Response) => {
  res.json({
    queue: testQueue,
    isRunning: isRunningTest,
    queueLength: testQueue.length,
  });
});

// Cancel current test and clear queue
app.post("/api/tests/cancel", (req: Request, res: Response) => {
  const cancelledCount = testQueue.length;
  const wasRunning = isRunningTest;

  // Signal to stop processing queue
  shouldCancelQueue = true;

  // Clear the queue
  testQueue.length = 0;

  // Signal abort for current test (controllers don't support cancellation yet)
  if (currentTestAbortController) {
    currentTestAbortController.abort();
    currentTestAbortController = null;
  }

  // Broadcast cancellation
  broadcast({
    type: "queue-cleared",
    data: {
      cancelledCount,
      wasRunning,
    },
  });

  res.json({
    message: "Queue cleared and current test cancelled",
    cancelledCount,
    wasRunning,
  });
});

// Pack a local directory
app.post("/api/pack", (req: Request, res: Response) => {
  const { directory } = req.body;

  if (!directory) {
    return res.status(400).json({ error: "Directory path is required" });
  }

  // Expand ~ to home directory
  const expandedDirectory = directory.startsWith("~")
    ? path.join(
        process.env.HOME || process.env.USERPROFILE || "",
        directory.slice(1),
      )
    : directory;

  // Run pack-and-run.sh equivalent: build and pack
  const packProcess = spawn(
    "bash",
    [
      "-c",
      `
    cd "${expandedDirectory}" && \
    npm run build && \
    npm pack | tail -n 1
  `,
    ],
    {
      cwd: rootDir,
      env: { ...process.env },
    },
  );

  let output = "";
  let error = "";
  let packedFile = "";

  packProcess.stdout?.on("data", (data: Buffer) => {
    const text = data.toString();
    output += text;

    // Capture the last line which should be the packed filename
    const lines = output.trim().split("\n");
    const lastLine = lines[lines.length - 1];
    if (lastLine.endsWith(".tgz")) {
      packedFile = lastLine;
    }
  });

  packProcess.stderr?.on("data", (data: Buffer) => {
    error += data.toString();
  });

  packProcess.on("close", (code: number | null) => {
    if (code === 0 && packedFile) {
      const absolutePath = path.resolve(expandedDirectory, packedFile);
      res.json({
        success: true,
        packagePath: `file:${absolutePath}`,
        output,
        packedFile: absolutePath,
        expandedDirectory,
      });
    } else {
      res.status(500).json({
        success: false,
        error: error || "Failed to pack directory",
        output,
      });
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Test runner API server listening on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔄 Auto-restart enabled with nodemon`);
});
