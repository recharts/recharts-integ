import { useEffect, useState } from "react";
import { PhaseName, Phases, Test, TestRun, TestStatus } from "../types";
import PhaseOutput from "../PhaseOutput";
import { formatDuration } from "../utils/formatDuration";
import { phaseOrder } from "../utils/phaseOrder.ts";

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
  estimatedPhaseDurations: Record<PhaseName, number>;
}

const STATUS_ICONS: Record<string, string> = {
  queued: "⏸️",
  running: "⏳",
  passed: "✅",
  cancelled: "⏹",
  failed: "❌",
};

export function TestItem({
  test,
  status,
  isSelected,
  isRunning,
  isQueued,
  hasResult,
  onToggleSelection,
  onRun,
  onClearResult,
  estimatedPhaseDurations,
}: TestItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<PhaseName | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const testName = test.name;

  const runningTest =
    status && "status" in status && status.status === "running"
      ? (status as TestRun)
      : null;
  const completedTest =
    hasResult &&
    status &&
    "status" in status &&
    status.status !== "running" &&
    status.status !== "queued"
      ? (status as TestRun)
      : null;

  // Calculate progress for running test
  useEffect(() => {
    if (!runningTest || !runningTest.phases) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      let totalElapsed = 0;

      // Calculate elapsed time across all phases

      phaseOrder.forEach((phaseName) => {
        const phase = runningTest.phases![phaseName];
        if (phase.startTime) {
          const start = new Date(phase.startTime).getTime();
          if (phase.endTime) {
            totalElapsed += new Date(phase.endTime).getTime() - start;
          } else if (phaseName === runningTest.currentPhase) {
            totalElapsed += now - start;
          }
        }
      });

      setElapsedTime(totalElapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [runningTest]);

  // Calculate total estimated time for this test
  const totalEstimated = Object.values(estimatedPhaseDurations).reduce(
    (sum, dur) => sum + dur,
    0,
  );
  const progressPercent = runningTest
    ? Math.min((elapsedTime / totalEstimated) * 100, 100)
    : 0;

  const handlePhaseClick = (phaseName: PhaseName) => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
    setExpandedPhase(phaseName);
  };

  const getOneLineSummary = (phases: Phases | undefined) => {
    if (!phases) return null;

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
          const durationText = phase.duration
            ? ` (${(phase.duration / 1000).toFixed(1)}s)`
            : "";

          // queued phases are not clickable
          if (phase.status === "pending") {
            return (
              <span
                key={phaseName}
                className={`phase-summary-item ${phase.status}`}
                title={`${label}: ${phase.status}${durationText}`}
              >
                {icon} {label}
              </span>
            );
          }

          // if a phase is either completed or running, we make it clickable
          return (
            <button
              key={phaseName}
              className={`phase-summary-item ${phase.status}`}
              title={`${label}: ${phase.status}${durationText}`}
              onClick={() => handlePhaseClick(phaseName)}
            >
              {icon} {label}
            </button>
          );
        })}
      </div>
    );
  };

  const statusStr = status && "status" in status ? status.status : "";

  return (
    <div className={`test-item ${isSelected ? "selected" : ""} ${statusStr}`}>
      <div
        className="test-item-header"
        style={
          runningTest
            ? {
                background: `linear-gradient(to right, rgba(102, 126, 234, 0.1) ${progressPercent}%, transparent ${progressPercent}%)`,
              }
            : undefined
        }
      >
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
        {test.description && (
          <span className="test-description" title={test.description}>
            {test.description}
          </span>
        )}
        {status && "status" in status && (
          <span className={`status-badge ${status.status}`}>
            {STATUS_ICONS[status.status] || "❌"}{" "}
            {status.status === "queued" && "position" in status
              ? `Queued (#${status.position})`
              : status.status}
          </span>
        )}
        {runningTest && (
          <span className="progress-info">
            {formatDuration(elapsedTime)} / {formatDuration(totalEstimated)}
          </span>
        )}
        <button onClick={onRun} disabled={isQueued} className="btn btn-small">
          {isQueued ? "Queued" : "Run"}
        </button>
        {completedTest && (
          <button
            onClick={onClearResult}
            className="btn btn-clear"
            title="Clear this result"
          >
            X️ Clear Result
          </button>
        )}
        {(runningTest || completedTest) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-small btn-expand"
            title={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? "▼ Collapse" : "▶ Expand"}
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
              initialExpandedPhase={expandedPhase}
              estimatedPhaseDurations={estimatedPhaseDurations}
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
            <PhaseOutput
              phases={completedTest.phases}
              currentPhase={null}
              initialExpandedPhase={expandedPhase}
              estimatedPhaseDurations={estimatedPhaseDurations}
            />
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
