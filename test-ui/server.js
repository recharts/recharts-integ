const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

const rootDir = path.join(__dirname, '..');

// Store active test runs
const activeTests = new Map();

// Test queue for serial execution
const testQueue = [];
let isRunningTest = false;
let currentTestProcess = null;

// WebSocket connections
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => {
    clients.delete(ws);
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Get list of all tests with stability information
app.get('/api/tests', (req, res) => {
  const { listAllTests } = require(path.join(rootDir, 'list.js'));
  
  try {
    const allTests = listAllTests(false);
    const stableTests = new Set(listAllTests(true));
    
    const testsWithMetadata = allTests.map(testName => ({
      name: testName,
      stable: stableTests.has(testName)
    }));
    
    res.json({ tests: testsWithMetadata });
  } catch (error) {
    console.error('Failed to list tests:', error);
    res.status(500).json({ error: 'Failed to list tests: ' + error.message });
  }
});

// Parse output to detect phase transitions
function parsePhases(output, testData) {
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

function updatePhase(testData, phaseName, status) {
  const phase = testData.phases[phaseName];
  if (phase) {
    phase.status = status;
    phase.endTime = new Date().toISOString();
    if (phase.startTime) {
      phase.duration = new Date(phase.endTime) - new Date(phase.startTime);
    }
  }
}

// Function to actually run a test
function executeTest(testName, rechartsVersion, testId) {
  return new Promise((resolve, reject) => {
    const args = ['run-test.sh', testName];
    if (rechartsVersion) {
      args.push(rechartsVersion);
    }

    const testProcess = spawn('bash', args, {
      cwd: rootDir,
      env: { ...process.env }
    });

    currentTestProcess = testProcess;

    const testData = {
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

    testProcess.stdout.on('data', (data) => {
      const output = data.toString();
      testData.output += output;
      
      // Parse output for phase detection
      parsePhases(output, testData);
      
      broadcast({
        type: 'test-output',
        data: { id: testId, output, phases: testData.phases, currentPhase: testData.currentPhase }
      });
    });

    testProcess.stderr.on('data', (data) => {
      const error = data.toString();
      testData.error += error;
      broadcast({
        type: 'test-error',
        data: { id: testId, error }
      });
    });

    testProcess.on('close', (code) => {
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

    testProcess.on('error', (err) => {
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
async function processQueue() {
  if (isRunningTest || testQueue.length === 0) {
    return;
  }

  isRunningTest = true;
  
  while (testQueue.length > 0) {
    const { testName, rechartsVersion, testId } = testQueue.shift();
    await executeTest(testName, rechartsVersion, testId);
  }
  
  isRunningTest = false;
}

// Run a single test (adds to queue)
app.post('/api/tests/run', (req, res) => {
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
app.get('/api/tests/:testId', (req, res) => {
  const { testId } = req.params;
  const testData = activeTests.get(testId);
  
  if (!testData) {
    return res.status(404).json({ error: 'Test not found' });
  }
  
  res.json(testData);
});

// Get all active tests
app.get('/api/tests/active/all', (req, res) => {
  const tests = Array.from(activeTests.values());
  res.json({ tests });
});

// Get queue status
app.get('/api/tests/queue', (req, res) => {
  res.json({ 
    queue: testQueue,
    isRunning: isRunningTest,
    queueLength: testQueue.length
  });
});

// Cancel current test and clear queue
app.post('/api/tests/cancel', (req, res) => {
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

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Test runner API server listening on port ${PORT}`);
});
