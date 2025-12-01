import { setLoading, setTests, setError } from "../store/testsSlice";
import { Test } from "../types";
import { AppDispatch } from "../store";

const API_BASE = "/api";

export async function loadTests(dispatch: AppDispatch) {
  try {
    dispatch(setLoading(true));
    const response = await fetch(`${API_BASE}/tests`);
    const data = await response.json();
    const testsArray: Test[] = data.tests.map((test: any) =>
      typeof test === "string" ? { name: test, stable: false } : test,
    );
    dispatch(setTests(testsArray));
    dispatch(setError(null));
  } catch (err) {
    dispatch(setError("Failed to load tests: " + (err as Error).message));
  } finally {
    dispatch(setLoading(false));
  }
}
