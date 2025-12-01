import { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
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
  setLocalPackagePath,
  setPackingDirectory,
  setIsPacking,
} from "./store/testsSlice";
import {
  selectQueuedTestsETA,
  selectRunningTestsETA,
  selectElapsedTimeForRunningTestPhases,
  selectAllRunningTests,
} from "./store/testDurationSelectors";
import { Test, TestRun } from "./types";
import { TestItem } from "./components/TestItem";
import { ControlRow, ControlRowContainer } from "./components/ControlRow";
import { formatDuration } from "./utils/formatDuration";
import "./App.css";

const API_BASE = "/api";

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
    localPackagePath,
    packingDirectory,
    isPacking,
    initialQueueSize,
    completedTestsCount,
  } = useAppSelector((state) => state.tests);

  const queuedETA = useAppSelector(selectQueuedTestsETA);
  const runningETA = useAppSelector(selectRunningTestsETA);
  const estimatedPhaseDurations = useAppSelector(
    selectElapsedTimeForRunningTestPhases,
  );
  const runningTestsList = useAppSelector(selectAllRunningTests);

  const [globalElapsedTime, setGlobalElapsedTime] = useState(0);
  const [versions, setVersions] = useState<{
    node: string;
    npm: string;
    yarn: string;
  } | null>(null);

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

  useEffect(() => {
    loadTests();
    loadPersistedResultsFromStorage();
    loadRechartsVersions();
    loadPersistedPackingDirectory();
    loadVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist test results to sessionStorage
  useEffect(() => {
    if (Object.keys(testResults).length > 0) {
      sessionStorage.setItem("testResults", JSON.stringify(testResults));
    }
  }, [testResults]);

  const loadTests = async () => {
    try {
      dispatch(setLoading(true));
      const response = await fetch(`${API_BASE}/tests`);
      const data = await response.json();
      const testsArray: Test[] = data.tests.map((test: any) =>
        typeof test === "string" ? { name: test, stable: false } : test,
      );
      dispatch(setTests(testsArray));
      dispatch(setError(null));
    } catch (err) {
      dispatch(setError("Failed to load tests: " + (err as Error).message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const loadPersistedResultsFromStorage = () => {
    try {
      const stored = sessionStorage.getItem("testResults");
      if (stored) {
        const results: Record<string, TestRun> = JSON.parse(stored);
        dispatch(loadPersistedResults(results));
      }
    } catch (err) {
      console.error("Failed to load persisted results:", err);
    }
  };

  const loadPersistedPackingDirectory = () => {
    try {
      const storedDirectory = localStorage.getItem("packingDirectory");
      const storedPackagePath = localStorage.getItem("localPackagePath");

      if (storedDirectory) {
        dispatch(setPackingDirectory(storedDirectory));
      }
      if (storedPackagePath) {
        dispatch(setLocalPackagePath(storedPackagePath));
      }
    } catch (err) {
      console.error("Failed to load persisted packing directory:", err);
    }
  };

  const loadVersions = async () => {
    try {
      const response = await fetch(`${API_BASE}/versions`);
      const data = await response.json();
      setVersions(data);
    } catch (err) {
      console.error("Failed to load versions:", err);
    }
  };

  const loadRechartsVersions = async () => {
    try {
      dispatch(setLoadingVersions(true));
      // Fetch from npm registry
      const response = await fetch("https://registry.npmjs.org/recharts");
      const data = await response.json();

      // Get versions and sort from latest to oldest
      const versions = Object.keys(data.versions || {})
        .filter((v) => !v.includes("-")) // Filter out pre-release versions
        .sort((a, b) => {
          // Compare version numbers (simple sort by version string works for semver)
          const aParts = a.split(".").map(Number);
          const bParts = b.split(".").map(Number);

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
      console.error("Failed to load Recharts versions:", err);
      dispatch(setLoadingVersions(false));
    }
  };

  const runTest = async (test: Test) => {
    try {
      // Determine which version to use
      let versionToUse = rechartsVersion;
      if (localPackagePath) {
        versionToUse = localPackagePath;
      }

      const response = await fetch(`${API_BASE}/tests/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testName: test.name,
          rechartsVersion: versionToUse || undefined,
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

  const handleDirectorySelect = async () => {
    // Note: File System Access API doesn't provide full paths for security reasons.
    // We use a text input instead, which works since the server runs locally.
    try {
      // Use the File System Access API for directory selection
      // @ts-ignore - Not all browsers support this yet
      if (!window.showDirectoryPicker) {
        dispatch(
          setError(
            "Directory picker not supported in this browser. Please use Chrome or Edge.",
          ),
        );
        return;
      }

      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();
      const dirPath = dirHandle.name; // This gives us just the name, not full path

      // In a real implementation, we'd need to pass the handle to the backend
      // For now, we'll ask the user to input the full path
      const fullPath = prompt(
        `Selected: ${dirPath}\n\nPlease enter the full absolute path to this directory:`,
      );

      if (fullPath) {
        dispatch(setPackingDirectory(fullPath));
        localStorage.setItem("packingDirectory", fullPath);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        dispatch(
          setError("Failed to select directory: " + (err as Error).message),
        );
      }
    }
  };

  const handlePackDirectory = async () => {
    if (!packingDirectory) {
      dispatch(setError("Please select a directory first"));
      return;
    }

    try {
      dispatch(setIsPacking(true));
      dispatch(setError(null));

      const response = await fetch(`${API_BASE}/pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory: packingDirectory }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to pack directory");
      }

      dispatch(setLocalPackagePath(data.packagePath));
      dispatch(setError(null));

      // Persist to localStorage
      localStorage.setItem("packingDirectory", packingDirectory);
      localStorage.setItem("localPackagePath", data.packagePath);

      console.log("Packed successfully:", data);
    } catch (err) {
      dispatch(setError("Failed to pack directory: " + (err as Error).message));
    } finally {
      dispatch(setIsPacking(false));
    }
  };

  const getFilteredTests = (): Test[] => {
    if (!filter) return tests;

    const filterLower = filter.toLowerCase();

    if (filterLower === "stable") {
      return tests.filter((test) => test.stable === true);
    }
    if (filterLower === "experimental") {
      return tests.filter((test) => test.stable === false);
    }

    return tests.filter((test) =>
      test.name.toLowerCase().includes(filterLower),
    );
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

  const filteredTests = getFilteredTests();

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
            <label>Local Package:</label>
            <input
              type="text"
              placeholder="Select directory to pack..."
              value={packingDirectory}
              onChange={(e) => {
                dispatch(setPackingDirectory(e.target.value));
                localStorage.setItem("packingDirectory", e.target.value);
              }}
              className="directory-input"
              disabled={isPacking}
            />
            <button
              onClick={handleDirectorySelect}
              className="btn btn-secondary btn-small"
              disabled={isPacking}
              title="Browse for directory"
            >
              📁 Browse
            </button>
            <button
              onClick={handlePackDirectory}
              className="btn btn-primary btn-small"
              disabled={!packingDirectory || isPacking}
              title="Build and pack the selected directory"
            >
              {isPacking ? "⏳ Packing..." : "📦 Pack"}
            </button>
            {localPackagePath && (
              <button
                onClick={() => {
                  dispatch(setLocalPackagePath(""));
                  dispatch(setPackingDirectory(""));
                  localStorage.removeItem("localPackagePath");
                  localStorage.removeItem("packingDirectory");
                }}
                className="btn btn-secondary btn-small"
                title="Clear local package"
              >
                ✕
              </button>
            )}
          </div>
        </ControlRowContainer>

        {localPackagePath && (
          <div className="local-package-info">
            ✅ Using local package: <code>{localPackagePath}</code>
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
