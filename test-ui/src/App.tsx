import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  setTests,
  setLoading,
  setError,
  setFilter,
  setRechartsVersion,
  toggleTestSelection,
  selectAllTests,
  deselectAllTests,
  clearTestResult,
  clearAllResults,
  loadPersistedResults,
  setAvailableVersions,
  setLoadingVersions,
} from './store/testsSlice';
import { Test, TestRun } from './types';
import PhaseOutput from './PhaseOutput';
import './App.css';

const API_BASE = '/api';

function App() {
  const dispatch = useAppDispatch();
  const {
    tests,
    loading,
    error,
    filter,
    selectedTests,
    queuedTests,
    runningTests,
    testResults,
    rechartsVersion,
    availableVersions,
    loadingVersions,
  } = useAppSelector((state) => state.tests);

  useEffect(() => {
    loadTests();
    loadPersistedResultsFromStorage();
    loadRechartsVersions();
  }, []);

  // Persist test results to sessionStorage
  useEffect(() => {
    if (Object.keys(testResults).length > 0) {
      sessionStorage.setItem('testResults', JSON.stringify(testResults));
    }
  }, [testResults]);

  const loadTests = async () => {
    try {
      dispatch(setLoading(true));
      const response = await fetch(`${API_BASE}/tests`);
      const data = await response.json();
      const testsArray: Test[] = data.tests.map((test: any) =>
        typeof test === 'string' ? { name: test, stable: false } : test
      );
      dispatch(setTests(testsArray));
      dispatch(setError(null));
    } catch (err) {
      dispatch(setError('Failed to load tests: ' + (err as Error).message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const loadPersistedResultsFromStorage = () => {
    try {
      const stored = sessionStorage.getItem('testResults');
      if (stored) {
        const results: Record<string, TestRun> = JSON.parse(stored);
        dispatch(loadPersistedResults(results));
      }
    } catch (err) {
      console.error('Failed to load persisted results:', err);
    }
  };

  const loadRechartsVersions = async () => {
    try {
      dispatch(setLoadingVersions(true));
      // Fetch from npm registry
      const response = await fetch('https://registry.npmjs.org/recharts');
      const data = await response.json();
      
      // Get versions and sort from latest to oldest
      const versions = Object.keys(data.versions || {})
        .filter(v => !v.includes('-')) // Filter out pre-release versions
        .sort((a, b) => {
          // Compare version numbers (simple sort by version string works for semver)
          const aParts = a.split('.').map(Number);
          const bParts = b.split('.').map(Number);
          
          for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aVal = aParts[i] || 0;
            const bVal = bParts[i] || 0;
            if (aVal !== bVal) {
              return bVal - aVal; // Descending order
            }
          }
          return 0;
        })
        .slice(0, 50); // Limit to 50 most recent versions
      
      dispatch(setAvailableVersions(versions));
    } catch (err) {
      console.error('Failed to load Recharts versions:', err);
      dispatch(setLoadingVersions(false));
    }
  };

  const runTest = async (test: Test) => {
    try {
      const response = await fetch(`${API_BASE}/tests/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testName: test.name,
          rechartsVersion: rechartsVersion || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start test');
      }

      const data = await response.json();
      console.log('Test started:', data);
    } catch (err) {
      dispatch(setError('Failed to run test: ' + (err as Error).message));
    }
  };

  const runSelectedTests = () => {
    selectedTests.forEach((test) => {
      runTest(test);
    });
    dispatch(deselectAllTests());
  };

  const cancelQueue = async () => {
    try {
      const response = await fetch(`${API_BASE}/tests/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel queue');
      }

      const data = await response.json();
      console.log('Queue cancelled:', data);
    } catch (err) {
      dispatch(setError('Failed to cancel queue: ' + (err as Error).message));
    }
  };

  const handleClearTestResult = (testName: string) => {
    dispatch(clearTestResult(testName));
  };

  const handleClearAllResults = () => {
    dispatch(clearAllResults());
    sessionStorage.removeItem('testResults');
  };

  const getFilteredTests = (): Test[] => {
    if (!filter) return tests;

    const filterLower = filter.toLowerCase();

    if (filterLower === 'stable') {
      return tests.filter((test) => test.stable === true);
    }
    if (filterLower === 'experimental') {
      return tests.filter((test) => test.stable === false);
    }

    return tests.filter((test) => test.name.toLowerCase().includes(filterLower));
  };

  const getTestStatus = (testName: string) => {
    if (queuedTests[testName]) {
      return { ...queuedTests[testName], status: 'queued' as const };
    }
    if (runningTests[testName]) {
      return runningTests[testName];
    }
    if (testResults[testName]) {
      return testResults[testName];
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
          <button onClick={() => dispatch(setError(null))}>✕</button>
        </div>
      )}

      <div className="controls">
        <div className="control-row">
          <input
            type="text"
            placeholder="Filter tests... (try: stable, experimental, npm, react18)"
            value={filter}
            onChange={(e) => dispatch(setFilter(e.target.value))}
            className="filter-input"
          />
          <select
            value={rechartsVersion}
            onChange={(e) => dispatch(setRechartsVersion(e.target.value))}
            className="version-select"
            disabled={loadingVersions}
          >
            <option value="">Latest version</option>
            {loadingVersions && <option value="">Loading versions...</option>}
            {availableVersions.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>
        </div>

        <div className="control-row">
          <button onClick={() => dispatch(selectAllTests(filteredTests))} className="btn btn-secondary">
            Select All ({filteredTests.length})
          </button>
          <button onClick={() => dispatch(deselectAllTests())} className="btn btn-secondary">
            Deselect All
          </button>
          <button
            onClick={runSelectedTests}
            disabled={selectedTests.length === 0}
            className="btn btn-primary"
          >
            Run Selected ({selectedTests.length})
          </button>
          {(Object.keys(queuedTests).length > 0 || Object.keys(runningTests).length > 0) && (
            <button onClick={cancelQueue} className="btn btn-danger">
              ⏹ Cancel & Clear Queue
            </button>
          )}
          {Object.keys(testResults).length > 0 && (
            <button onClick={handleClearAllResults} className="btn btn-secondary">
              🗑 Clear All Results
            </button>
          )}
        </div>
      </div>

      <div className="content">
        <div className="test-list">
          <h2>Tests ({filteredTests.length})</h2>
          {filteredTests.map((test) => {
            const testName = test.name;
            const status = getTestStatus(testName);
            const isSelected = selectedTests.some((t) => t.name === testName);
            const isRunning = !!runningTests[testName];
            const isQueued = !!queuedTests[testName];

            return (
              <div
                key={testName}
                className={`test-item ${isSelected ? 'selected' : ''} ${status?.status || ''}`}
              >
                <div className="test-item-header">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => dispatch(toggleTestSelection(test))}
                    disabled={isRunning || isQueued}
                  />
                  <span className="test-name">{testName}</span>
                  <span className={`stability-badge ${test.stable ? 'stable' : 'experimental'}`}>
                    {test.stable ? '✓ Stable' : '⚠ Experimental'}
                  </span>
                  {status && (
                    <span className={`status-badge ${status.status}`}>
                      {status.status === 'queued'
                        ? '⏸️'
                        : status.status === 'running'
                        ? '⏳'
                        : status.status === 'passed'
                        ? '✅'
                        : '❌'}
                      {' '}
                      {status.status === 'queued'
                        ? `Queued (#${(status as any).position})`
                        : status.status}
                    </span>
                  )}
                  <button onClick={() => runTest(test)} disabled={isRunning || isQueued} className="btn btn-small">
                    Run
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="results-panel">
          <h2>Test Output</h2>
          {Object.keys(queuedTests).length === 0 &&
            Object.keys(runningTests).length === 0 &&
            Object.keys(testResults).length === 0 && (
              <div className="empty-state">No tests running. Select and run tests to see output.</div>
            )}

          {Object.keys(queuedTests).length > 0 && (
            <div className="queue-info">
              <h3>⏸️ Queue ({Object.keys(queuedTests).length} test{Object.keys(queuedTests).length !== 1 ? 's' : ''})</h3>
              <p>Tests will run one at a time in series.</p>
              <ul>
                {Object.entries(queuedTests)
                  .sort((a, b) => a[1].position - b[1].position)
                  .map(([testName, data]) => (
                    <li key={testName}>
                      #{data.position}: {testName}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {Object.entries(runningTests).map(([testName, data]) => (
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

          {Object.entries(testResults).map(([testName, data]) => (
            <div key={testName} className="result-item">
              <h3>
                {testName}
                <span className={`status-badge ${data.status}`}>
                  {data.status === 'passed'
                    ? '✅ Passed'
                    : data.status === 'cancelled'
                    ? '⏹ Cancelled'
                    : '❌ Failed'}
                </span>
                <button onClick={() => handleClearTestResult(testName)} className="btn btn-clear" title="Clear this result">
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
