import { RootState } from './store';
import { Test } from '../types';

export const selectFilteredTests = (state: RootState): Test[] => {
  const { tests, filter } = state.tests;

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
