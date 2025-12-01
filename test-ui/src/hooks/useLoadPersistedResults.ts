import { loadPersistedResults } from "../store/testsSlice";
import { TestRun } from "../types";
import { AppDispatch } from "../store";

export function loadPersistedResultsFromStorage(dispatch: AppDispatch) {
  try {
    const stored = sessionStorage.getItem("testResults");
    if (stored) {
      const results: Record<string, TestRun> = JSON.parse(stored);
      dispatch(loadPersistedResults(results));
    }
  } catch (err) {
    console.error("Failed to load persisted results:", err);
  }
}
