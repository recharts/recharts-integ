import { describe, it, expect } from "vitest";
import { configureStore, Store } from "@reduxjs/toolkit";
import { rootReducer, RootState } from "../../src/store/store";
import {
  clearTestResult,
  loadPersistedResults,
} from "../../src/store/testsSlice";
import { Phase, TestRun } from "../../src/types";

const examplePhase: Phase = {
  status: "passed",
  output: "",
  duration: 100,
  startTime: null,
  endTime: null,
};

describe("testsSlice", () => {
  it("should clear test results", () => {
    const store: Store<RootState> = configureStore({ reducer: rootReducer });
    expect(store.getState().tests.testResults).toEqual({});

    const exampleRun: TestRun = {
      error: "",
      id: "1",
      status: "passed",
      output: "",
      phases: {
        clean: examplePhase,
        install: examplePhase,
        test: examplePhase,
        build: examplePhase,
        verify: examplePhase,
        setVersion: examplePhase,
      },
      exitCode: 0,
    };

    store.dispatch(
      loadPersistedResults({
        foo: exampleRun,
      }),
    );

    expect(store.getState().tests.testResults).toEqual({
      foo: exampleRun,
    });

    store.dispatch(clearTestResult("foo"));

    expect(store.getState().tests.testResults).toEqual({});
  });
});
