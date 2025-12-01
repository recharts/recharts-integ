import { describe, it, expect } from 'vitest';
import { selectFilteredTests } from '../../src/store/filteredTestsSelector';
import { RootState } from '../../src/store/store';
import { Test } from '../../src/types';

const createMockTest = (name: string, stable: boolean): Test => ({
  name,
  stable,
  type: 'library',
  packageManager: 'npm',
  description: '',
});

const createMockState = (tests: Test[], filter: string): RootState => ({
  tests: {
    tests,
    loading: false,
    error: null,
    filter,
    selectedTests: [],
    queuedTests: {},
    runningTests: {},
    testResults: {},
    rechartsVersion: '3.0.0',
    availableVersions: [],
    loadingVersions: false,
    localPackagePath: '',
    packingDirectory: '',
    isPacking: false,
    initialQueueSize: 0,
    completedTestsCount: 0,
  },
});

describe('selectFilteredTests', () => {
  const mockTests: Test[] = [
    createMockTest('ts-react16', true),
    createMockTest('ts-react17', true),
    createMockTest('experimental-feature', false),
    createMockTest('another-stable-test', true),
  ];

  it('should return all tests when filter is empty', () => {
    const state = createMockState(mockTests, '');
    const result = selectFilteredTests(state);
    expect(result).toEqual(mockTests);
    expect(result).toHaveLength(4);
  });

  it('should filter by "stable" keyword', () => {
    const state = createMockState(mockTests, 'stable');
    const result = selectFilteredTests(state);
    expect(result).toHaveLength(3);
    expect(result.every((test) => test.stable === true)).toBe(true);
  });

  it('should filter by "Stable" keyword (case insensitive)', () => {
    const state = createMockState(mockTests, 'Stable');
    const result = selectFilteredTests(state);
    expect(result).toHaveLength(3);
    expect(result.every((test) => test.stable === true)).toBe(true);
  });

  it('should filter by "experimental" keyword', () => {
    const state = createMockState(mockTests, 'experimental');
    const result = selectFilteredTests(state);
    expect(result).toHaveLength(1);
    expect(result.every((test) => test.stable === false)).toBe(true);
  });

  it('should filter by "Experimental" keyword (case insensitive)', () => {
    const state = createMockState(mockTests, 'Experimental');
    const result = selectFilteredTests(state);
    expect(result).toHaveLength(1);
    expect(result.every((test) => test.stable === false)).toBe(true);
  });

  it('should filter by test name substring', () => {
    const state = createMockState(mockTests, 'react16');
    const result = selectFilteredTests(state);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('ts-react16');
  });

  it('should filter by test name substring (case insensitive)', () => {
    const state = createMockState(mockTests, 'REACT17');
    const result = selectFilteredTests(state);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('ts-react17');
  });

  it('should return multiple tests matching the filter', () => {
    const state = createMockState(mockTests, 'ts');
    const result = selectFilteredTests(state);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.name)).toContain('ts-react16');
    expect(result.map((t) => t.name)).toContain('ts-react17');
  });

  it('should return empty array when no tests match', () => {
    const state = createMockState(mockTests, 'nonexistent');
    const result = selectFilteredTests(state);
    expect(result).toHaveLength(0);
  });

  it('should handle empty test list', () => {
    const state = createMockState([], 'test');
    const result = selectFilteredTests(state);
    expect(result).toHaveLength(0);
  });

  it('should prioritize "stable" keyword over substring match', () => {
    const testsWithStableInName = [
      createMockTest('stable-feature', false),
      createMockTest('another-test', true),
    ];
    const state = createMockState(testsWithStableInName, 'stable');
    const result = selectFilteredTests(state);
    expect(result).toHaveLength(1);
    expect(result[0].stable).toBe(true);
    expect(result[0].name).toBe('another-test');
  });

  it('should prioritize "experimental" keyword over substring match', () => {
    const testsWithExperimentalInName = [
      createMockTest('experimental-feature', true),
      createMockTest('another-test', false),
    ];
    const state = createMockState(testsWithExperimentalInName, 'experimental');
    const result = selectFilteredTests(state);
    expect(result).toHaveLength(1);
    expect(result[0].stable).toBe(false);
    expect(result[0].name).toBe('another-test');
  });
});
