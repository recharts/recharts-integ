import { useEffect, useState } from "react";
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
import { Test, TestRun, TestStatus, Phases } from "./types";
import PhaseOutput from "./PhaseOutput";
import "./App.css";

const API_BASE = "/api";

interface TestItemProps {
  test: Test;
  status: TestStatus | null;
  isSelected: boolean;
  isRunning: boolean;
  isQueued: boolean;
  hasResult: boolean;
  onToggleSelection: () => void;
  onRun: () => void;
  onClearResult: () => void;
}

function TestItem({
  test,
  status,
  isSelected,
  isRunning,
  isQueued,
  hasResult,
  onToggleSelection,
  onRun,
  onClearResult,
}: TestItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const testName = test.name;

  const runningTest = status && status.status === "running" ? (status as TestRun) : null;
  const completedTest = hasResult && status && status.status !== "running" && status.status !== "queued" ? (status as TestRun) : null;

  const getOneLineSummary = (phases: Phases | undefined) => {
    if (!phases) return null;

    const phaseOrder = ["clean", "setVersion", "install", "test", "build", "verify"] as const;
    const phaseLabels = {
      clean: "Clean",
      setVersion: "Set Version",
      install: "Install",
      test: "Test",
      build: "Build",
      verify: "Verify",
    };
    const icons = {
      pending: "⏸️",
      running: "⏳",
      passed: "✅",
      failed: "❌",
    };

    return (
      <div className="phase-summary">
        {phaseOrder.map((phaseName) => {
          const phase = phases[phaseName];
          const label = phaseLabels[phaseName];
          const icon = icons[phase.status];
          const durationText = phase.duration ? ` (${(phase.duration / 1000).toFixed(1)}s)` : "";
          
          return (
            <span
              key={phaseName}
              className={`phase-summary-item ${phase.status}`}
              title={`${label}: ${phase.status}${durationText}`}
            >
              {icon} {label}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`test-item ${isSelected ? "selected" : ""} ${status?.status || ""}`}
    >
      <div className="test-item-header">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          disabled={isRunning || isQueued}
        />
        <span className="test-name">{testName}</span>
        <span
          className={`stability-badge ${test.stable ? "stable" : "experimental"}`}
        >
          {test.stable ? "✓ Stable" : "⚠ Experimental"}
        </span>
        {status && (
          <span className={`status-badge ${status.status}`}>
            {status.status === "queued"
              ? "⏸️"
              : status.status === "running"
                ? "⏳"
                : status.status === "passed"
                  ? "✅"
                  : status.status === "cancelled"
                    ? "⏹"
                    : "❌"}{" "}
            {status.status === "queued"
              ? `Queued (#${(status as any).position})`
              : status.status}
          </span>
        )}
        <button
          onClick={onRun}
          disabled={isRunning || isQueued}
          className="btn btn-small"
        >
          Run
        </button>
        {(runningTest || completedTest) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-small btn-expand"
            title={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? "▼ Hide" : "▶ Show"}
          </button>
        )}
        {completedTest && (
          <button
            onClick={onClearResult}
            className="btn btn-clear"
            title="Clear this result"
          >
            ✕
          </button>
        )}
      </div>

      {(runningTest || completedTest) && (
        <div className="test-item-summary">
          {getOneLineSummary((runningTest || completedTest)?.phases)}
        </div>
      )}

      {isExpanded && runningTest && (
        <div className="test-item-details">
          {runningTest.phases ? (
            <PhaseOutput
              phases={runningTest.phases}
              currentPhase={runningTest.currentPhase}
            />
          ) : (
            <div className="output-box">
              <pre>{runningTest.output}</pre>
              {runningTest.error && (
                <pre className="error-output">{runningTest.error}</pre>
              )}
            </div>
          )}
        </div>
      )}

      {isExpanded && completedTest && (
        <div className="test-item-details">
          {completedTest.phases ? (
            <PhaseOutput phases={completedTest.phases} currentPhase={null} />
          ) : (
            <div className="output-box">
              <pre>{completedTest.output}</pre>
              {completedTest.error && (
                <pre className="error-output">{completedTest.error}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
  } = useAppSelector((state) => state.tests);

  useEffect(() => {
    loadTests();
    loadPersistedResultsFromStorage();
    loadRechartsVersions();
    loadPersistedPackingDirectory();
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

  const handleClearAllResults = () => {
    dispatch(clearAllResults());
    sessionStorage.removeItem("testResults");
  };

  const handleDirectorySelect = async () => {
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
        </div>

        <div className="control-row version-controls">
          <div className="version-group">
            <label>NPM Version:</label>
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
              <option value="">Latest version</option>
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
        </div>

        {localPackagePath && (
          <div className="local-package-info">
            ✅ Using local package: <code>{localPackagePath}</code>
          </div>
        )}

        <div className="control-row">
          <button
            onClick={() => dispatch(selectAllTests(filteredTests))}
            className="btn btn-secondary"
          >
            Select All ({filteredTests.length})
          </button>
          <button
            onClick={() => dispatch(deselectAllTests())}
            className="btn btn-secondary"
          >
            Deselect All
          </button>
          <button
            onClick={runSelectedTests}
            disabled={selectedTests.length === 0}
            className="btn btn-primary"
          >
            Run Selected ({selectedTests.length})
          </button>
          {(Object.keys(queuedTests).length > 0 ||
            Object.keys(runningTests).length > 0) && (
            <button onClick={cancelQueue} className="btn btn-danger">
              ⏹ Cancel & Clear Queue
            </button>
          )}
          {Object.keys(testResults).length > 0 && (
            <button
              onClick={handleClearAllResults}
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
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
