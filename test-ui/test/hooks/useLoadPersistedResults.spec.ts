import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadPersistedResultsFromStorage } from "../../src/hooks/useLoadPersistedResults";
import { loadPersistedResults } from "../../src/store/testsSlice";
import type { AppDispatch } from "../../src/store";

describe("loadPersistedResultsFromStorage", () => {
  let mockDispatch: AppDispatch;

  beforeEach(() => {
    mockDispatch = vi.fn() as unknown as AppDispatch;
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("should load persisted results from sessionStorage", () => {
    const mockResults = {
      "test1": {
        id: "test1",
        status: "passed" as const,
        output: "",
        error: "",
        phases: undefined,
      },
    };

    sessionStorage.setItem("testResults", JSON.stringify(mockResults));

    loadPersistedResultsFromStorage(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledWith(loadPersistedResults(mockResults));
  });

  it("should handle empty sessionStorage", () => {
    loadPersistedResultsFromStorage(mockDispatch);

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("should handle invalid JSON in sessionStorage", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    sessionStorage.setItem("testResults", "invalid json");

    loadPersistedResultsFromStorage(mockDispatch);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to load persisted results:",
      expect.any(Error),
    );
    expect(mockDispatch).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
