export interface Test {
  name: string;
  stable: boolean;
  type?: 'direct' | 'library';
  packageManager?: 'npm' | 'yarn';
  dependencies?: {
    react?: string;
    [key: string]: string | undefined;
  };
}

export interface NpmVersion {
  version: string;
  time: string;
}

export interface Phase {
  status: 'pending' | 'running' | 'passed' | 'failed';
  output: string;
  duration: number | null;
  startTime: string | null;
  endTime: string | null;
}

export interface Phases {
  clean: Phase;
  setVersion: Phase;
  install: Phase;
  test: Phase;
  build: Phase;
  verify: Phase;
}

export type PhaseName = keyof Phases;

export interface TestRun {
  id: string;
  status: 'queued' | 'running' | 'passed' | 'failed' | 'cancelled';
  output: string;
  error: string;
  phases?: Phases;
  currentPhase?: PhaseName;
  position?: number;
  exitCode?: number | null;
}

export interface QueuedTest {
  id: string;
  position: number;
}

export type TestStatus = TestRun | QueuedTest;
