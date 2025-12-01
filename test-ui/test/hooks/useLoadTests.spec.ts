import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadTests } from "../../src/hooks/useLoadTests";
import { setLoading, setTests, setError } from "../../src/store/testsSlice";
import type { AppDispatch } from "../../src/store";

global.fetch = vi.fn();

describe("loadTests", () => {
  let mockDispatch: AppDispatch;

  beforeEach(() => {
    mockDispatch = vi.fn() as unknown as AppDispatch;
    vi.clearAllMocks();
  });

  it("should successfully load tests", async () => {
    const mockTests = [
      { name: "test1", stable: true },
      "test2",
    ];

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ tests: mockTests }),
    });

    await loadTests(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledWith(setLoading(true));
    expect(mockDispatch).toHaveBeenCalledWith(
      setTests([
        { name: "test1", stable: true },
        { name: "test2", stable: false },
      ]),
    );
    expect(mockDispatch).toHaveBeenCalledWith(setError(null));
    expect(mockDispatch).toHaveBeenCalledWith(setLoading(false));
  });

  it("should handle fetch errors", async () => {
    const mockError = new Error("Network error");
    (global.fetch as any).mockRejectedValueOnce(mockError);

    await loadTests(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledWith(setLoading(true));
    expect(mockDispatch).toHaveBeenCalledWith(
      setError("Failed to load tests: Network error"),
    );
    expect(mockDispatch).toHaveBeenCalledWith(setLoading(false));
  });
});
