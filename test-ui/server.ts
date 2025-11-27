import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';
import { WebSocketServer } from 'ws';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

const rootDir = path.join(__dirname, '..');

// Types
interface TestData {
  id: string;
  testName: string;
  rechartsVersion: string;
  status: 'running' | 'passed' | 'failed' | 'cancelled';
  output: string;
  error: string;
  startTime: string;
  endTime: string | null;
  exitCode: number | null;
  phases: Phases;
  currentPhase: PhaseName;
}

interface Phase {
  status: 'pending' | 'running' | 'passed' | 'failed';
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
let currentTestProcess: ChildProcess | null = null;

// WebSocket connections
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);
  ws.on('close', () => {
    clients.delete(ws);
  });
});

function broadcast(data: BroadcastMessage): void {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Get list of all tests with stability information
app.get('/api/tests', async (req: Request, res: Response) => {
  try {
    const listModule = await import(path.join(rootDir, 'list.js'));
    const listAllTests = listModule.listAllTests;
    
    const allTests: string[] = listAllTests(false);
    const stableTests = new Set<string>(listAllTests(true));
    
    const testsWithMetadata = allTests.map(testName => ({
      name: testName,
      stable: stableTests.has(testName)
    }));
    
    res.json({ tests: testsWithMetadata });
  } catch (error: any) {
    console.error('Failed to list tests:', error);
    res.status(500).json({ error: 'Failed to list tests: ' + error.message });
  }
});

// Parse output to detect phase transitions
function parsePhases(output: string, testData: TestData): void {
  const lines = output.split('\n');
  
  for (const line of lines) {
    // Detect phase markers from TestResult output
    if (line.includes('✅ clean') || line.includes('❌ clean')) {
      updatePhase(testData, 'clean', line.includes('✅') ? 'passed' : 'failed');
      testData.currentPhase = 'setVersion';
    } else if (line.includes('✅ replacePackageJsonVersion') || line.includes('❌ replacePackageJsonVersion')) {
      updatePhase(testData, 'setVersion', line.includes('✅') ? 'passed' : 'failed');
      testData.currentPhase = 'install';
    } else if (line.includes('✅ install') || line.includes('❌ install')) {
      updatePhase(testData, 'install', line.includes('✅') ? 'passed' : 'failed');
      testData.currentPhase = 'test';
    } else if (line.includes('✅ test') || line.includes('❌ test')) {
      updatePhase(testData, 'test', line.includes('✅') ? 'passed' : 'failed');
      testData.currentPhase = 'build';
    } else if (line.includes('✅ build') || line.includes('❌ build')) {
      updatePhase(testData, 'build', line.includes('✅') ? 'passed' : 'failed');
      testData.currentPhase = 'verify';
    } else if (line.includes('✅ verifySingleDependencyVersion') || line.includes('❌ verifySingleDependencyVersion')) {
      if (testData.phases.verify.status === 'pending') {
        testData.phases.verify.status = 'running';
        testData.phases.verify.startTime = new Date().toISOString();
      }
    }
    
    // Accumulate output to current phase
    const phase = testData.phases[testData.currentPhase];
    if (phase) {
      phase.output += line + '\n';
      if (phase.status === 'pending') {
        phase.status = 'running';
        phase.startTime = new Date().toISOString();
      }
    }
  }
}

function updatePhase(testData: TestData, phaseName: PhaseName, status: 'passed' | 'failed'): void {
  const phase = testData.phases[phaseName];
  if (phase) {
    phase.status = status;
    phase.endTime = new Date().toISOString();
    if (phase.startTime) {
      phase.duration = new Date(phase.endTime).getTime() - new Date(phase.startTime).getTime();
    }
  }
}

// Function to actually run a test
function executeTest(testName: string, rechartsVersion: string | undefined, testId: string): Promise<void> {
  return new Promise((resolve) => {
    const args = ['run-test.sh', testName];
    if (rechartsVersion) {
      args.push(rechartsVersion);
    }

    const testProcess = spawn('bash', args, {
      cwd: rootDir,
      env: { ...process.env }
    });

    currentTestProcess = testProcess;

    const testData: TestData = {
      id: testId,
      testName,
      rechartsVersion: rechartsVersion || 'default',
      status: 'running',
      output: '',
      error: '',
      startTime: new Date().toISOString(),
      endTime: null,
      exitCode: null,
      phases: {
        clean: { status: 'pending', output: '', duration: null, startTime: null, endTime: null },
        setVersion: { status: 'pending', output: '', duration: null, startTime: null, endTime: null },
        install: { status: 'pending', output: '', duration: null, startTime: null, endTime: null },
        test: { status: 'pending', output: '', duration: null, startTime: null, endTime: null },
        build: { status: 'pending', output: '', duration: null, startTime: null, endTime: null },
        verify: { status: 'pending', output: '', duration: null, startTime: null, endTime: null }
      },
      currentPhase: 'clean'
    };

    activeTests.set(testId, testData);

    broadcast({
      type: 'test-started',
      data: { id: testId, testName }
    });

    testProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      testData.output += output;
      
      // Parse output for phase detection
      parsePhases(output, testData);
      
      broadcast({
        type: 'test-output',
        data: { id: testId, output, phases: testData.phases, currentPhase: testData.currentPhase }
      });
    });

    testProcess.stderr?.on('data', (data: Buffer) => {
      const error = data.toString();
      testData.error += error;
      broadcast({
        type: 'test-error',
        data: { id: testId, error }
      });
    });

    testProcess.on('close', (code: number | null) => {
      currentTestProcess = null;
      
      // Check if it was cancelled
      if (code === null) {
        testData.status = 'cancelled';
        testData.exitCode = null;
      } else {
        testData.status = code === 0 ? 'passed' : 'failed';
        testData.exitCode = code;
      }
      testData.endTime = new Date().toISOString();
      
      broadcast({
        type: 'test-completed',
        data: { 
          id: testId, 
          status: testData.status,
          exitCode: code
        }
      });

      resolve();
    });

    testProcess.on('error', (err: Error) => {
      currentTestProcess = null;
      testData.status = 'failed';
      testData.error += `\nProcess error: ${err.message}`;
      testData.endTime = new Date().toISOString();
      
      broadcast({
        type: 'test-completed',
        data: { 
          id: testId, 
          status: 'failed',
          exitCode: -1
        }
      });
      
      resolve();
    });
  });
}

// Process the test queue
async function processQueue(): Promise<void> {
  if (isRunningTest || testQueue.length === 0) {
    return;
  }

  isRunningTest = true;
  
  while (testQueue.length > 0) {
    const item = testQueue.shift();
    if (item) {
      await executeTest(item.testName, item.rechartsVersion, item.testId);
    }
  }
  
  isRunningTest = false;
}

// Run a single test (adds to queue)
app.post('/api/tests/run', (req: Request, res: Response) => {
  const { testName, rechartsVersion } = req.body;
  
  if (!testName) {
    return res.status(400).json({ error: 'testName is required' });
  }

  const testId = `${testName}-${Date.now()}`;
  
  // Add to queue
  testQueue.push({ testName, rechartsVersion, testId });
  
  // Broadcast that test is queued
  broadcast({
    type: 'test-queued',
    data: { id: testId, testName, position: testQueue.length }
  });

  // Start processing queue
  processQueue();

  res.json({ 
    testId,
    message: testQueue.length === 1 ? 'Test started' : 'Test queued',
    testName,
    queuePosition: testQueue.length
  });
});

// Get test status
app.get('/api/tests/:testId', (req: Request, res: Response) => {
  const { testId } = req.params;
  const testData = activeTests.get(testId);
  
  if (!testData) {
    return res.status(404).json({ error: 'Test not found' });
  }
  
  res.json(testData);
});

// Get all active tests
app.get('/api/tests/active/all', (req: Request, res: Response) => {
  const tests = Array.from(activeTests.values());
  res.json({ tests });
});

// Get queue status
app.get('/api/tests/queue', (req: Request, res: Response) => {
  res.json({ 
    queue: testQueue,
    isRunning: isRunningTest,
    queueLength: testQueue.length
  });
});

// Cancel current test and clear queue
app.post('/api/tests/cancel', (req: Request, res: Response) => {
  const cancelledCount = testQueue.length;
  const wasRunning = isRunningTest;
  
  // Clear the queue
  testQueue.length = 0;
  
  // Kill current test if running
  if (currentTestProcess) {
    currentTestProcess.kill('SIGTERM');
    currentTestProcess = null;
  }
  
  // Broadcast cancellation
  broadcast({
    type: 'queue-cleared',
    data: { 
      cancelledCount,
      wasRunning
    }
  });
  
  res.json({ 
    message: 'Queue cleared and current test cancelled',
    cancelledCount,
    wasRunning
  });
});

// Pack a local directory
app.post('/api/pack', (req: Request, res: Response) => {
  const { directory } = req.body;
  
  if (!directory) {
    return res.status(400).json({ error: 'Directory path is required' });
  }

  // Expand ~ to home directory
  const expandedDirectory = directory.startsWith('~') 
    ? path.join(process.env.HOME || process.env.USERPROFILE || '', directory.slice(1))
    : directory;

  const packId = `pack-${Date.now()}`;
  
  // Run pack-and-run.sh equivalent: build and pack
  const packProcess = spawn('bash', ['-c', `
    cd "${expandedDirectory}" && \
    npm run build && \
    npm pack | tail -n 1
  `], {
    cwd: rootDir,
    env: { ...process.env }
  });

  let output = '';
  let error = '';
  let packedFile = '';

  packProcess.stdout?.on('data', (data: Buffer) => {
    const text = data.toString();
    output += text;
    
    // Capture the last line which should be the packed filename
    const lines = output.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    if (lastLine.endsWith('.tgz')) {
      packedFile = lastLine;
    }
  });

  packProcess.stderr?.on('data', (data: Buffer) => {
    error += data.toString();
  });

  packProcess.on('close', (code: number | null) => {
    if (code === 0 && packedFile) {
      const absolutePath = path.resolve(expandedDirectory, packedFile);
      res.json({
        success: true,
        packagePath: `file:${absolutePath}`,
        output,
        packedFile: absolutePath,
        expandedDirectory
      });
    } else {
      res.status(500).json({
        success: false,
        error: error || 'Failed to pack directory',
        output
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
