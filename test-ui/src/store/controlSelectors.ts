import { RootState } from './store';
import { Test } from '../types';

export const selectQueuedTests = (state: RootState): Record<string, { position: number }> => {
  return state.tests.queuedTests;
};

export const selectRunningTests = (state: RootState): Record<string, any> => {
  return state.tests.runningTests;
};

export const selectTestResults = (state: RootState): Record<string, any> => {
  return state.tests.testResults;
};

export const selectSelectedTests = (state: RootState): Test[] => {
  return state.tests.selectedTests;
};

export const selectHasQueue = (state: RootState): boolean => {
  return (
    Object.keys(state.tests.queuedTests).length > 0 ||
    Object.keys(state.tests.runningTests).length > 0
  );
};

export const selectHasResults = (state: RootState): boolean => {
  return Object.keys(state.tests.testResults).length > 0;
};
