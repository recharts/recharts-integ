import { RootState } from "./store.ts";
import { PhaseName, TestRun } from "../types.ts";
import { createSelector } from "@reduxjs/toolkit";

const selectQueueLength = (state: RootState) =>
  Object.keys(state.tests.queuedTests).length;

/**
 * Multiple tests may be running at once.
 * From each running test, we can get its current phase.
 * This phase contains startTime. We will later use this to estimate ETA.
 */
export const selectAllRunningTests: (
  state: RootState,
) => ReadonlyArray<TestRun> = createSelector(
  [(state: RootState) => state.tests.runningTests],
  (runningTests) => Object.values(runningTests),
);

/**
 * These tests have already completed.
 */
export const selectAllTestResults: (
  state: RootState,
) => ReadonlyArray<TestRun> = createSelector(
  [(state: RootState) => state.tests.testResults],
  (testResults) => Object.values(testResults),
);

const educatedGuess: Record<PhaseName, number> = {
  clean: 3000,
  setVersion: 3000,
  install: 20000,
  test: 2000,
  build: 3000,
  verify: 300,
};

/**
 * In the state, we have previous test durations for completed tests.
 * This is a mapping of test phase to average duration in milliseconds.
 * If no tests have finished, this will return an educated guess.
 */
export const selectElapsedTimeForRunningTestPhases: (
  state: RootState,
) => Record<PhaseName, number> = createSelector(
  [selectAllTestResults],
  (testResults: ReadonlyArray<TestRun>) => {
    if (testResults.length === 0) {
      return educatedGuess;
    }
    const phaseDurations: Record<PhaseName, number[]> = {
      clean: [],
      setVersion: [],
      install: [],
      test: [],
      build: [],
      verify: [],
    };

    testResults.forEach((test) => {
      if (test.phases) {
        (Object.keys(test.phases) as PhaseName[]).forEach((phaseName) => {
          const phase = test.phases![phaseName];
          if (phase.duration !== null) {
            phaseDurations[phaseName].push(phase.duration);
          }
        });
      }
    });

    const averageDurations: Record<PhaseName, number> = {
      clean: 0,
      setVersion: 0,
      install: 0,
      test: 0,
      build: 0,
      verify: 0,
    };

    (Object.keys(phaseDurations) as PhaseName[]).forEach((phaseName) => {
      const durations = phaseDurations[phaseName];
      if (durations.length > 0) {
        const total = durations.reduce((sum, dur) => sum + dur, 0);
        averageDurations[phaseName] = total / durations.length;
      } else {
        averageDurations[phaseName] = educatedGuess[phaseName];
      }
    });

    return averageDurations;
  },
);

/**
 * Selects estimated time, in milliseconds, for all the queued tests.
 * Excludes currently running tests.
 * If there are no queued tests, returns 0.
 */
export const selectQueuedTestsETA: (state: RootState) => number =
  createSelector(
    [selectElapsedTimeForRunningTestPhases, selectQueueLength],
    (averageDurations, queueLength) => {
      if (queueLength === 0) {
        return 0;
      }

      // we know that each test will go through all phases
      const totalPerTest = Object.values(averageDurations).reduce(
        (sum, dur) => sum + dur,
        0,
      );

      return Math.ceil(totalPerTest * queueLength);
    },
  );

/**
 * Selects the estimated time of arrival (ETA) for all currently running tests.
 * Returns 0 if there are no running tests.
 * @param state
 */
export const selectRunningTestsETA: (state: RootState) => number =
  createSelector(
    [selectAllRunningTests, selectElapsedTimeForRunningTestPhases],
    (runningTests, previousDurations): number => {
      if (runningTests.length === 0) {
        return 0;
      }

      /*
       * This calculation is more complicated than the queue
       * because each test may be in a different phase.
       * For each running test, we need to:
       * 1. Identify its current phase.
       * 2. Calculate elapsed time in that phase.
       * 3. Sum remaining estimated time in current phase + all subsequent phases.
       */
      let totalETA = 0;

      runningTests.forEach((test) => {
        if (!test.currentPhase || !test.phases) {
          return;
        }

        // Use explicit phase order to ensure consistent calculation
        const PHASE_ORDER: PhaseName[] = [
          "clean",
          "setVersion",
          "install",
          "test",
          "build",
          "verify",
        ];
        const phaseNames = PHASE_ORDER;
        const currentPhaseIndex = phaseNames.indexOf(test.currentPhase);
        if (currentPhaseIndex === -1) {
          return;
        }

        let testETA = 0;

        for (let i = currentPhaseIndex; i < phaseNames.length; i++) {
          const phaseName = phaseNames[i];
          const phase = test.phases[phaseName];

          if (i === currentPhaseIndex) {
            // Current phase - calculate remaining time
            if (phase.startTime) {
              const now = Date.now();
              // phase.startTime is a string YYYY-MM-DDTHH:mm:ss.sssZ, so we have to parse it
              const startTimestamp = new Date(phase.startTime).getTime();
              const elapsed = now - startTimestamp;
              const estimatedTotal = previousDurations[phaseName];
              const remaining = Math.max(estimatedTotal - elapsed, 0);
              testETA += remaining;
            } else {
              // Phase started but no startTime? Use full estimate
              testETA += previousDurations[phaseName];
            }
          } else {
            // Future phases - use full estimate
            testETA += previousDurations[phaseName];
          }
        }

        totalETA += testETA;
      });

      return Math.ceil(totalETA);
    },
  );
