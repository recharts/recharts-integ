import { describe, expect, it } from "vitest";
import { rootReducer, RootState } from "../../src/store/store";
import { configureStore, Store } from "@reduxjs/toolkit";
import {
  loadPersistedResults,
  testOutput,
  testQueued,
  testStarted,
} from "../../src/store/testsSlice";
import { exampleTestResults } from "./exampleTestResults";
import {
  selectAllRunningTests,
  selectAllTestResults,
  selectElapsedTimeForRunningTestPhases,
  selectQueuedTestsETA,
  selectRunningTestsETA,
} from "../../src/store/testDurationSelectors";
import { Phase } from "../../src/types";

const pending: Phase = {
  status: "pending",
  output: "",
  duration: null,
  startTime: null,
  endTime: null,
};

function prepareStore(): Store<RootState> {
  const store = configureStore({ reducer: rootReducer });
  store.dispatch(loadPersistedResults(exampleTestResults));
  // this test is started but none of its phases are actually in-progress now
  store.dispatch(
    testStarted({
      testName: "example-test-1",
      id: "test-id-1",
    }),
  );

  // this test is started, the clean phase has already finished, and now it's in the setVersion phase
  store.dispatch(
    testStarted({
      testName: "example-test-2",
      id: "test-id-2",
    }),
  );
  store.dispatch(
    testOutput({
      id: "test-id-2",
      output: "",
      phases: {
        clean: {
          status: "passed",
          output: "",
          duration: 2500,
          startTime: "2025-11-28T02:19:49.844Z",
          endTime: "2025-11-28T02:19:52.061Z",
        },
        setVersion: {
          status: "running",
          output: "",
          duration: null,
          startTime: "2025-11-28T02:19:49.844Z",
          endTime: null,
        },
        install: pending,
        test: pending,
        build: pending,
        verify: pending,
      },
      currentPhase: "setVersion",
    }),
  );

  // there are three tests in the queue
  store.dispatch(
    testQueued({
      testName: "example-test-3",
      id: "test-id-3",
      position: 1,
    }),
  );
  store.dispatch(
    testQueued({
      testName: "example-test-4",
      id: "test-id-4",
      position: 2,
    }),
  );
  store.dispatch(
    testQueued({
      testName: "example-test-5",
      id: "test-id-5",
      position: 3,
    }),
  );
  return store;
}

describe("selectAllTestResults", () => {
  it("should select all test results from the store", () => {
    const store = prepareStore();
    const testResults = selectAllTestResults(store.getState());

    expect(testResults.length).toBe(
      Object.keys(exampleTestResults).length,
    );
    expect(testResults).toEqual(Object.values(exampleTestResults));
  });
});

describe("selectElapsedTimeForRunningTestPhases", () => {
  it("should calculate average phase durations from test results", () => {
    const store = prepareStore();

    const elapsedTimes = selectElapsedTimeForRunningTestPhases(
      store.getState(),
    );

    expect(elapsedTimes).toEqual({
      build: 2682.0689655172414,
      clean: 2359.766666666667,
      install: 18898.3,
      setVersion: 3918.266666666667,
      test: 1764.0689655172414,
      verify: 357.17241379310343,
    });
  });
});

describe("selectAllRunningTests", () => {
  it("should select all running tests from the store", () => {
    const store = prepareStore();
    const state = store.getState();
    const runningTests = selectAllRunningTests(state);

    expect(runningTests).toEqual(Object.values(state.tests.runningTests));
  });
});

describe("selectQueuedTestsETA", () => {
  it("should estimate the total remaining time for queued tests", () => {
    const store = prepareStore();
    const state = store.getState();
    const eta = selectQueuedTestsETA(state);

    expect(eta).toBe(89939); // Based on the average durations and 3 queued tests
  });
});

describe("selectRunningTestsETA", () => {
  it("should estimate the remaining time for currently running tests", () => {
    const store = prepareStore();
    const state = store.getState();
    const eta = selectRunningTestsETA(state);

    // Based on the remaining durations of the two running tests
    // Note: This expectation uses snapshot values from fixture and may be brittle
    // if fixture timestamps change. Consider using toBeCloseTo or mocking Date.now().
    expect(eta).toBe(53682);
  });
});
