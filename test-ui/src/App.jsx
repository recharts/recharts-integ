import React, { useState, useEffect, useRef } from 'react';
import PhaseOutput from './PhaseOutput';
import './App.css';

const API_BASE = '/api';
const WS_URL = 'ws://localhost:3001';

function App() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTests, setSelectedTests] = useState(new Set());
  const [runningTests, setRunningTests] = useState(new Map());
  const [queuedTests, setQueuedTests] = useState(new Map());
  const [testResults, setTestResults] = useState(new Map());
  const [rechartsVersion, setRechartsVersion] = useState('');
  const [filter, setFilter] = useState('');
  const wsRef = useRef(null);

  useEffect(() => {
    loadTests();
    loadPersistedResults();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Persist test results to sessionStorage
  useEffect(() => {
    if (testResults.size > 0) {
      const resultsArray = Array.from(testResults.entries());
      sessionStorage.setItem('testResults', JSON.stringify(resultsArray));
    }
  }, [testResults]);

  const loadPersistedResults = () => {
    try {
      const stored = sessionStorage.getItem('testResults');
      if (stored) {
        const resultsArray = JSON.parse(stored);
        setTestResults(new Map(resultsArray));
      }
    } catch (err) {
      console.error('Failed to load persisted results:', err);
    }
  };

  const connectWebSocket = () => {
    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(connectWebSocket, 3000);
    };

    wsRef.current = ws;
  };

  const handleWebSocketMessage = (message) => {
    const { type, data } = message;

    switch (type) {
      case 'test-queued':
        setQueuedTests(prev => new Map(prev).set(data.testName, {
          id: data.id,
          position: data.position
        }));
        break;

      case 'test-started':
        // Remove from queue and add to running
        setQueuedTests(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.testName);
          return newMap;
        });
        setRunningTests(prev => new Map(prev).set(data.testName, {
          id: data.id,
          status: 'running',
          output: '',
          error: '',
          phases: {
            clean: { status: 'pending', output: '', duration: null },
            setVersion: { status: 'pending', output: '', duration: null },
            install: { status: 'pending', output: '', duration: null },
            test: { status: 'pending', output: '', duration: null },
            build: { status: 'pending', output: '', duration: null },
            verify: { status: 'pending', output: '', duration: null }
          },
          currentPhase: 'clean'
        }));
        break;

      case 'test-output':
        setRunningTests(prev => {
          const newMap = new Map(prev);
          const testName = Array.from(prev.entries())
            .find(([_, v]) => v.id === data.id)?.[0];
          if (testName) {
            const test = newMap.get(testName);
            test.output += data.output;
            if (data.phases) {
              test.phases = data.phases;
            }
            if (data.currentPhase) {
              test.currentPhase = data.currentPhase;
            }
            newMap.set(testName, { ...test });
          }
          return newMap;
        });
        break;

      case 'test-error':
        setRunningTests(prev => {
          const newMap = new Map(prev);
          const testName = Array.from(prev.entries())
            .find(([_, v]) => v.id === data.id)?.[0];
          if (testName) {
            const test = newMap.get(testName);
            test.error += data.error;
            newMap.set(testName, { ...test });
          }
          return newMap;
        });
        break;

      case 'test-completed':
        setRunningTests(prev => {
          const newMap = new Map(prev);
          const testName = Array.from(prev.entries())
            .find(([_, v]) => v.id === data.id)?.[0];
          if (testName) {
            const test = newMap.get(testName);
            test.status = data.status;
            test.exitCode = data.exitCode;
            newMap.set(testName, { ...test });
            
            // Move to results after a brief delay
            setTimeout(() => {
              setTestResults(results => new Map(results).set(testName, { ...test }));
              setRunningTests(running => {
                const updated = new Map(running);
                updated.delete(testName);
                return updated;
              });
            }, 1000);
          }
          return newMap;
        });
        break;

      case 'queue-cleared':
        setQueuedTests(new Map());
        setRunningTests(new Map());
        break;
    }
  };

  const loadTests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/tests`);
      const data = await response.json();
      // Handle both old format (array of strings) and new format (array of objects)
      const testsArray = data.tests.map(test => 
        typeof test === 'string' ? { name: test, stable: false } : test
      );
      setTests(testsArray);
      setError(null);
    } catch (err) {
      setError('Failed to load tests: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const runTest = async (test) => {
    const testName = typeof test === 'string' ? test : test.name;
    try {
      const response = await fetch(`${API_BASE}/tests/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testName,
          rechartsVersion: rechartsVersion || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start test');
      }

      const data = await response.json();
      console.log('Test started:', data);
    } catch (err) {
      setError('Failed to run test: ' + err.message);
    }
  };

  const runSelectedTests = () => {
    selectedTests.forEach(test => {
      runTest(test);
    });
    setSelectedTests(new Set());
  };

  const toggleTestSelection = (test) => {
    const newSelected = new Set(selectedTests);
    const testName = test.name;
    const existing = Array.from(newSelected).find(t => t.name === testName);
    if (existing) {
      newSelected.delete(existing);
    } else {
      newSelected.add(test);
    }
    setSelectedTests(newSelected);
  };

  const selectAll = () => {
    const filtered = getFilteredTests();
    setSelectedTests(new Set(filtered));
  };

  const deselectAll = () => {
    setSelectedTests(new Set());
  };

  const cancelQueue = async () => {
    try {
      const response = await fetch(`${API_BASE}/tests/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel queue');
      }

      const data = await response.json();
      console.log('Queue cancelled:', data);
    } catch (err) {
      setError('Failed to cancel queue: ' + err.message);
    }
  };

  const clearTestResult = (testName) => {
    setTestResults(prev => {
      const newMap = new Map(prev);
      newMap.delete(testName);
      return newMap;
    });
  };

  const clearAllResults = () => {
    setTestResults(new Map());
    sessionStorage.removeItem('testResults');
  };

  const getFilteredTests = () => {
    if (!filter) return tests;
    
    const filterLower = filter.toLowerCase();
    
    // Check for stability keywords
    if ("stable".startsWith(filterLower)) {
      return tests.filter(test => test.stable === true);
    }
    if ('experimental'.startsWith(filterLower)) {
      return tests.filter(test => test.stable === false);
    }
    
    // Regular text search in test name
    return tests.filter(test => 
      test.name.toLowerCase().includes(filterLower)
    );
  };

  const getTestStatus = (testName) => {
    if (queuedTests.has(testName)) {
      return { ...queuedTests.get(testName), status: 'queued' };
    }
    if (runningTests.has(testName)) {
      return runningTests.get(testName);
    }
    if (testResults.has(testName)) {
      return testResults.get(testName);
    }
    return null;
  };

  const filteredTests = getFilteredTests();

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading tests...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🧪 Recharts Integration Test Runner</h1>
      </header>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="controls">
        <div className="control-row">
          <input
            type="text"
            placeholder="Filter tests... (try: stable, experimental, npm, react18)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-input"
          />
          <input
            type="text"
            placeholder="Recharts version (optional)"
            value={rechartsVersion}
            onChange={(e) => setRechartsVersion(e.target.value)}
            className="version-input"
          />
        </div>

        <div className="control-row">
          <button onClick={selectAll} className="btn btn-secondary">
            Select All ({filteredTests.length})
          </button>
          <button onClick={deselectAll} className="btn btn-secondary">
            Deselect All
          </button>
          <button 
            onClick={runSelectedTests} 
            disabled={selectedTests.size === 0}
            className="btn btn-primary"
          >
            Run Selected ({selectedTests.size})
          </button>
          {(queuedTests.size > 0 || runningTests.size > 0) && (
            <button 
              onClick={cancelQueue} 
              className="btn btn-danger"
            >
              ⏹ Cancel & Clear Queue
            </button>
          )}
          {testResults.size > 0 && (
            <button 
              onClick={clearAllResults} 
              className="btn btn-secondary"
            >
              🗑 Clear All Results
            </button>
          )}
        </div>
      </div>

      <div className="content">
        <div className="test-list">
          <h2>Tests ({filteredTests.length})</h2>
          {filteredTests.map(test => {
            const testName = test.name;
            const status = getTestStatus(testName);
            const isSelected = Array.from(selectedTests).some(t => t.name === testName);
            const isRunning = runningTests.has(testName);
            const isQueued = queuedTests.has(testName);

            return (
              <div
                key={testName}
                className={`test-item ${isSelected ? 'selected' : ''} ${status?.status || ''}`}
              >
                <div className="test-item-header">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTestSelection(test)}
                    disabled={isRunning || isQueued}
                  />
                  <span className="test-name">{testName}</span>
                  <span className={`stability-badge ${test.stable ? 'stable' : 'experimental'}`}>
                    {test.stable ? '✓ Stable' : '⚠ Experimental'}
                  </span>
                  {status && (
                    <span className={`status-badge ${status.status}`}>
                      {status.status === 'queued' ? '⏸️' :
                       status.status === 'running' ? '⏳' : 
                       status.status === 'passed' ? '✅' : '❌'}
                      {' '}{status.status === 'queued' ? `Queued (#${status.position})` : status.status}
                    </span>
                  )}
                  <button
                    onClick={() => runTest(test)}
                    disabled={isRunning || isQueued}
                    className="btn btn-small"
                  >
                    Run
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="results-panel">
          <h2>Test Output</h2>
          {queuedTests.size === 0 && runningTests.size === 0 && testResults.size === 0 && (
            <div className="empty-state">
              No tests running. Select and run tests to see output.
            </div>
          )}

          {queuedTests.size > 0 && (
            <div className="queue-info">
              <h3>⏸️ Queue ({queuedTests.size} test{queuedTests.size !== 1 ? 's' : ''})</h3>
              <p>Tests will run one at a time in series.</p>
              <ul>
                {Array.from(queuedTests.entries())
                  .sort((a, b) => a[1].position - b[1].position)
                  .map(([testName, data]) => (
                    <li key={testName}>#{data.position}: {testName}</li>
                  ))}
              </ul>
            </div>
          )}

          {Array.from(runningTests.entries()).map(([testName, data]) => (
            <div key={testName} className="result-item">
              <h3>
                {testName}
                <span className="status-badge running">⏳ Running</span>
              </h3>
              {data.phases ? (
                <PhaseOutput phases={data.phases} currentPhase={data.currentPhase} />
              ) : (
                <div className="output-box">
                  <pre>{data.output}</pre>
                  {data.error && <pre className="error-output">{data.error}</pre>}
                </div>
              )}
            </div>
          ))}

          {Array.from(testResults.entries()).map(([testName, data]) => (
            <div key={testName} className="result-item">
              <h3>
                {testName}
                <span className={`status-badge ${data.status}`}>
                  {data.status === 'passed' ? '✅ Passed' : 
                   data.status === 'cancelled' ? '⏹ Cancelled' : '❌ Failed'}
                </span>
                <button
                  onClick={() => clearTestResult(testName)}
                  className="btn btn-clear"
                  title="Clear this result"
                >
                  ✕
                </button>
              </h3>
              {data.phases ? (
                <PhaseOutput phases={data.phases} currentPhase={null} />
              ) : (
                <div className="output-box">
                  <pre>{data.output}</pre>
                  {data.error && <pre className="error-output">{data.error}</pre>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
