import { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  setError,
  setFilter,
  setRechartsVersion,
  toggleTestSelection,
  deselectAllTests,
  clearTestResult,
  setLocalPackagePath,
} from "./store/testsSlice";
import {
  selectQueuedTestsETA,
  selectRunningTestsETA,
  selectElapsedTimeForRunningTestPhases,
  selectAllRunningTests,
} from "./store/testDurationSelectors";
import { selectFilteredTests } from "./store/filteredTestsSelector";
import {
  selectPackingDirectory,
  selectIsPacking,
  selectLocalPackagePath,
} from "./store/packingDirectorySelector";
import { Test, TestRun } from "./types";
import { TestItem } from "./components/TestItem";
import { ControlRow, ControlRowContainer } from "./components/ControlRow";
import { DirectoryInput } from "./components/DirectoryInput";
import { formatDuration } from "./utils/formatDuration";
import { useLoadAllInfo } from "./hooks/useLoadAllInfo";
import "./App.css";

const API_BASE = "/api";

function App() {
  const dispatch = useAppDispatch();
  const {
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
    initialQueueSize,
    completedTestsCount,
  } = useAppSelector((state) => state.tests);

  const localPackagePath = useAppSelector(selectLocalPackagePath);
  const packingDirectory = useAppSelector(selectPackingDirectory);
  const isPacking = useAppSelector(selectIsPacking);

  const queuedETA = useAppSelector(selectQueuedTestsETA);
  const runningETA = useAppSelector(selectRunningTestsETA);
  const estimatedPhaseDurations = useAppSelector(
    selectElapsedTimeForRunningTestPhases,
  );
  const runningTestsList = useAppSelector(selectAllRunningTests);

  const { versions } = useLoadAllInfo();
  const [globalElapsedTime, setGlobalElapsedTime] = useState(0);

  // Track global elapsed time using ref to avoid stale closure
  const globalStartTimeRef = useRef<number | null>(null);
  useEffect(() => {
    const hasRunningOrQueued =
      runningTestsList.length > 0 || Object.keys(queuedTests).length > 0;

    if (!hasRunningOrQueued) {
      setGlobalElapsedTime(0);
      globalStartTimeRef.current = null;
      return;
    }

    // Set start time only once when queue starts
    if (globalStartTimeRef.current === null) {
      globalStartTimeRef.current = Date.now();
    }

    const interval = setInterval(() => {
      if (globalStartTimeRef.current !== null) {
        setGlobalElapsedTime(Date.now() - globalStartTimeRef.current);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [runningTestsList.length, queuedTests]);

  // Persist test results to sessionStorage
  useEffect(() => {
    if (Object.keys(testResults).length > 0) {
      sessionStorage.setItem("testResults", JSON.stringify(testResults));
    }
  }, [testResults]);

  const runTest = async (test: Test) => {
    try {
      // Determine which version to use
      let versionToUse = rechartsVersion;
      let packDir = undefined;
      
      // If packingDirectory is set, pass it to the server to pack before running
      if (packingDirectory) {
        packDir = packingDirectory;
      } else if (localPackagePath) {
        // Use already packed version
        versionToUse = localPackagePath;
      }

      const response = await fetch(`${API_BASE}/tests/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testName: test.name,
          rechartsVersion: versionToUse || undefined,
          packDirectory: packDir,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start test");
      }

      const data = await response.json();
      console.log("Test started:", data);
    } catch (err) {
      dispatch(setError("Failed to run test: " + (err as Error).message));
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to cancel queue");
      }

      const data = await response.json();
      console.log("Queue cancelled:", data);
    } catch (err) {
      dispatch(setError("Failed to cancel queue: " + (err as Error).message));
    }
  };

  const handleClearTestResult = (testName: string) => {
    dispatch(clearTestResult(testName));
    // clear single item from session storage
    const stored = sessionStorage.getItem("testResults");
    if (stored) {
      const results: Record<string, TestRun> = JSON.parse(stored);
      delete results[testName];
      sessionStorage.setItem("testResults", JSON.stringify(results));
    }
  };



  const getTestStatus = (testName: string) => {
    if (queuedTests[testName]) {
      return { ...queuedTests[testName], status: "queued" as const };
    }
    if (runningTests[testName]) {
      return runningTests[testName];
    }
    if (testResults[testName]) {
      return testResults[testName];
    }
    return null;
  };

  const filteredTests = useAppSelector(selectFilteredTests);

  // Calculate global progress using test counts instead of phase counts
  const totalTests = initialQueueSize || 0;
  const currentTests = completedTestsCount;
  const globalProgress = totalTests > 0 ? (currentTests / totalTests) * 100 : 0;
  const totalETA = runningETA + queuedETA;

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
        {versions && (
          <div className="versions">
            <span>Node: {versions.node}</span>
            <span>npm: {versions.npm}</span>
            <span>Yarn: {versions.yarn}</span>
          </div>
        )}
      </header>

      {(runningTestsList.length > 0 || Object.keys(queuedTests).length > 0) && (
        <div className="global-progress-bar">
          <div className="progress-stats">
            <span>
              📊 Progress: {currentTests} / {totalTests} tests
            </span>
            <span>⏱️ Elapsed: {formatDuration(globalElapsedTime)}</span>
            <span>⏳ ETA: {formatDuration(totalETA)}</span>
            <span>
              🔄 Running: {runningTestsList.length} | ⏸️ Queued:{" "}
              {Object.keys(queuedTests).length}
            </span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${globalProgress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => dispatch(setError(null))}>✕</button>
        </div>
      )}

      <div className="controls">
        <ControlRowContainer>
          <input
            type="text"
            placeholder="Filter tests... (try: stable, experimental, npm, react18)"
            value={filter}
            onChange={(e) => dispatch(setFilter(e.target.value))}
            className="filter-input"
          />
        </ControlRowContainer>

        <ControlRowContainer className="version-controls">
          <div className="version-group">
            <label>Recharts version:</label>
            <select
              value={rechartsVersion}
              onChange={(e) => {
                dispatch(setRechartsVersion(e.target.value));
                if (e.target.value) {
                  dispatch(setLocalPackagePath(""));
                }
              }}
              className="version-select"
              disabled={loadingVersions || !!localPackagePath}
            >
              <option value="">As decided by each test</option>
              {loadingVersions && <option value="">Loading versions...</option>}
              {availableVersions.map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </div>

          <div className="version-divider">OR</div>

          <div className="version-group local-package-group">
            <label>Local Package Directory:</label>
            <DirectoryInput disabled={isPacking} />
            {packingDirectory && (
              <span className="packing-info">
                Will pack before running tests
              </span>
            )}
            {localPackagePath && (
              <button
                onClick={() => {
                  dispatch(setLocalPackagePath(""));
                  localStorage.removeItem("localPackagePath");
                }}
                className="btn btn-secondary btn-small"
                title="Clear local package"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </ControlRowContainer>

        {isPacking && (
          <div className="local-package-info packing">
            ⏳ Packing directory...
          </div>
        )}
        {localPackagePath && !isPacking && (
          <div className="local-package-info">
            ✅ Using local package: <code>{localPackagePath}</code>
          </div>
        )}
        {packingDirectory && !localPackagePath && !isPacking && (
          <div className="local-package-info">
            📦 Will pack <code>{packingDirectory}</code> before running tests
          </div>
        )}

        <ControlRow
          filteredTests={filteredTests}
          onRunSelected={runSelectedTests}
          onCancelQueue={cancelQueue}
        />
      </div>

      <div className="content">
        <div className="test-list">
          <h2>Tests ({filteredTests.length})</h2>
          {Object.keys(queuedTests).length > 0 && (
            <div className="queue-info">
              <h3>
                ⏸️ Queue ({Object.keys(queuedTests).length} test
                {Object.keys(queuedTests).length !== 1 ? "s" : ""})
              </h3>
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
          {filteredTests.map((test) => {
            const testName = test.name;
            const status = getTestStatus(testName);
            const isSelected = selectedTests.some((t) => t.name === testName);
            const isRunning = !!runningTests[testName];
            const isQueued = !!queuedTests[testName];
            const hasResult = !!testResults[testName];

            return (
              <TestItem
                key={testName}
                test={test}
                status={status}
                isSelected={isSelected}
                isRunning={isRunning}
                isQueued={isQueued}
                hasResult={hasResult}
                onToggleSelection={() => dispatch(toggleTestSelection(test))}
                onRun={() => runTest(test)}
                onClearResult={() => handleClearTestResult(testName)}
                estimatedPhaseDurations={estimatedPhaseDurations}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
