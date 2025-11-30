import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Test, TestRun, Phases, PhaseName } from '../types';

interface TestsState {
  tests: Test[];
  loading: boolean;
  error: string | null;
  filter: string;
  selectedTests: Test[];
  queuedTests: Record<string, { id: string; position: number }>;
  runningTests: Record<string, TestRun>;
  testResults: Record<string, TestRun>;
  rechartsVersion: string;
  availableVersions: string[];
  loadingVersions: boolean;
  localPackagePath: string;
  packingDirectory: string;
  isPacking: boolean;
  initialQueueSize: number;
  completedTestsCount: number;
}

const initialState: TestsState = {
  tests: [],
  loading: false,
  error: null,
  filter: '',
  selectedTests: [],
  queuedTests: {},
  runningTests: {},
  testResults: {},
  rechartsVersion: '',
  availableVersions: [],
  loadingVersions: false,
  localPackagePath: '',
  packingDirectory: '',
  isPacking: false,
  initialQueueSize: 0,
  completedTestsCount: 0,
};

const testsSlice = createSlice({
  name: 'tests',
  initialState,
  reducers: {
    setTests: (state, action: PayloadAction<Test[]>) => {
      state.tests = action.payload;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFilter: (state, action: PayloadAction<string>) => {
      state.filter = action.payload;
    },
    setRechartsVersion: (state, action: PayloadAction<string>) => {
      state.rechartsVersion = action.payload;
    },
    toggleTestSelection: (state, action: PayloadAction<Test>) => {
      const index = state.selectedTests.findIndex(t => t.name === action.payload.name);
      if (index >= 0) {
        state.selectedTests.splice(index, 1);
      } else {
        state.selectedTests.push(action.payload);
      }
    },
    selectAllTests: (state, action: PayloadAction<Test[]>) => {
      state.selectedTests = action.payload;
    },
    deselectAllTests: (state) => {
      state.selectedTests = [];
    },
    testQueued: (state, action: PayloadAction<{ testName: string; id: string; position: number }>) => {
      state.queuedTests[action.payload.testName] = {
        id: action.payload.id,
        position: action.payload.position,
      };
      // Track initial queue size when first test is added
      const totalTests = Object.keys(state.queuedTests).length + Object.keys(state.runningTests).length;
      if (state.initialQueueSize === 0) {
        state.initialQueueSize = totalTests;
        state.completedTestsCount = 0;
      } else {
        // Update if queue grew
        state.initialQueueSize = Math.max(state.initialQueueSize, totalTests + state.completedTestsCount);
      }
    },
    testStarted: (state, action: PayloadAction<{ testName: string; id: string }>) => {
      delete state.queuedTests[action.payload.testName];
      state.runningTests[action.payload.testName] = {
        id: action.payload.id,
        status: 'running',
        output: '',
        error: '',
        phases: {
          clean: { status: 'pending', output: '', duration: null, startTime: null, endTime: null },
          setVersion: { status: 'pending', output: '', duration: null, startTime: null, endTime: null },
          install: { status: 'pending', output: '', duration: null, startTime: null, endTime: null },
          test: { status: 'pending', output: '', duration: null, startTime: null, endTime: null },
          build: { status: 'pending', output: '', duration: null, startTime: null, endTime: null },
          verify: { status: 'pending', output: '', duration: null, startTime: null, endTime: null },
        },
        currentPhase: 'clean',
      };
    },
    testOutput: (
      state,
      action: PayloadAction<{ id: string; output: string; phases?: Phases; currentPhase?: PhaseName }>
    ) => {
      const testName = Object.keys(state.runningTests).find(
        name => state.runningTests[name].id === action.payload.id
      );
      if (testName) {
        const test = state.runningTests[testName];
        test.output += action.payload.output;
        if (action.payload.phases) {
          test.phases = action.payload.phases;
        }
        if (action.payload.currentPhase) {
          test.currentPhase = action.payload.currentPhase;
        }
      }
    },
    testError: (state, action: PayloadAction<{ id: string; error: string }>) => {
      const testName = Object.keys(state.runningTests).find(
        name => state.runningTests[name].id === action.payload.id
      );
      if (testName) {
        state.runningTests[testName].error += action.payload.error;
      }
    },
    testCompleted: (
      state,
      action: PayloadAction<{ id: string; status: 'passed' | 'failed' | 'cancelled'; exitCode: number | null }>
    ) => {
      const testName = Object.keys(state.runningTests).find(
        name => state.runningTests[name].id === action.payload.id
      );
      if (testName) {
        const test = state.runningTests[testName];
        test.status = action.payload.status;
        test.exitCode = action.payload.exitCode;
        state.completedTestsCount++;
        
        // Reset queue tracking when queue is empty
        const remainingTests = Object.keys(state.queuedTests).length + Object.keys(state.runningTests).length;
        if (remainingTests === 1) { // This test is still in runningTests
          state.initialQueueSize = 0;
          state.completedTestsCount = 0;
        }
      }
    },
    moveToResults: (state, action: PayloadAction<string>) => {
      const testName = action.payload;
      if (state.runningTests[testName]) {
        state.testResults[testName] = state.runningTests[testName];
        delete state.runningTests[testName];
      }
    },
    queueCleared: (state) => {
      state.queuedTests = {};
      state.runningTests = {};
      state.initialQueueSize = 0;
      state.completedTestsCount = 0;
    },
    clearTestResult: (state, action: PayloadAction<string>) => {
      delete state.testResults[action.payload];
    },
    clearAllResults: (state) => {
      state.testResults = {};
    },
    loadPersistedResults: (state, action: PayloadAction<Record<string, TestRun>>) => {
      state.testResults = action.payload;
    },
    setAvailableVersions: (state, action: PayloadAction<string[]>) => {
      state.availableVersions = action.payload;
      state.loadingVersions = false;
    },
    setLoadingVersions: (state, action: PayloadAction<boolean>) => {
      state.loadingVersions = action.payload;
    },
    setLocalPackagePath: (state, action: PayloadAction<string>) => {
      state.localPackagePath = action.payload;
    },
    setPackingDirectory: (state, action: PayloadAction<string>) => {
      state.packingDirectory = action.payload;
    },
    setIsPacking: (state, action: PayloadAction<boolean>) => {
      state.isPacking = action.payload;
    },
  },
});

export const {
  setTests,
  setLoading,
  setError,
  setFilter,
  setRechartsVersion,
  toggleTestSelection,
  selectAllTests,
  deselectAllTests,
  testQueued,
  testStarted,
  testOutput,
  testError,
  testCompleted,
  moveToResults,
  queueCleared,
  clearTestResult,
  clearAllResults,
  loadPersistedResults,
  setAvailableVersions,
  setLoadingVersions,
  setLocalPackagePath,
  setPackingDirectory,
  setIsPacking,
} = testsSlice.actions;

export default testsSlice.reducer;
