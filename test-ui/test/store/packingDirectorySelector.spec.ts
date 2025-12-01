import { describe, it, expect } from 'vitest';
import {
  selectPackingDirectory,
  selectIsPacking,
  selectLocalPackagePath,
} from '../../src/store/packingDirectorySelector';
import { RootState } from '../../src/store/store';

describe('packingDirectorySelector', () => {
  const createMockState = (overrides: Partial<RootState['tests']> = {}): RootState => ({
    tests: {
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
      ...overrides,
    },
  });

  describe('selectPackingDirectory', () => {
    it('should return empty string when no directory is set', () => {
      const state = createMockState();
      expect(selectPackingDirectory(state)).toBe('');
    });

    it('should return the packing directory', () => {
      const state = createMockState({ packingDirectory: '/home/user/recharts' });
      expect(selectPackingDirectory(state)).toBe('/home/user/recharts');
    });
  });

  describe('selectIsPacking', () => {
    it('should return false when not packing', () => {
      const state = createMockState();
      expect(selectIsPacking(state)).toBe(false);
    });

    it('should return true when packing', () => {
      const state = createMockState({ isPacking: true });
      expect(selectIsPacking(state)).toBe(true);
    });
  });

  describe('selectLocalPackagePath', () => {
    it('should return empty string when no package path is set', () => {
      const state = createMockState();
      expect(selectLocalPackagePath(state)).toBe('');
    });

    it('should return the local package path', () => {
      const state = createMockState({ localPackagePath: '/tmp/recharts-3.5.1.tgz' });
      expect(selectLocalPackagePath(state)).toBe('/tmp/recharts-3.5.1.tgz');
    });
  });
});
