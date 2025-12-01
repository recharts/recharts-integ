import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadRechartsVersions } from "../../src/hooks/useLoadRechartsVersions";
import {
  setLoadingVersions,
  setAvailableVersions,
} from "../../src/store/testsSlice";
import type { AppDispatch } from "../../src/store";

describe("loadRechartsVersions", () => {
  let mockDispatch: AppDispatch;

  beforeEach(() => {
    mockDispatch = vi.fn() as unknown as AppDispatch;
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should successfully load and sort recharts versions", async () => {
    const mockRegistry = {
      versions: {
        "3.5.1": {},
        "3.4.0": {},
        "3.5.0": {},
        "3.4.0-beta.1": {},
        "2.12.0": {},
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockRegistry,
    });

    await loadRechartsVersions(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledWith(setLoadingVersions(true));
    expect(mockDispatch).toHaveBeenCalledWith(
      setAvailableVersions(["3.5.1", "3.5.0", "3.4.0", "2.12.0"]),
    );
  });

  it("should filter out pre-release versions", async () => {
    const mockRegistry = {
      versions: {
        "3.5.1": {},
        "3.5.0-alpha": {},
        "3.4.0-beta.1": {},
        "3.4.0": {},
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockRegistry,
    });

    await loadRechartsVersions(mockDispatch);

    const setAvailableVersionsCall = (mockDispatch as any).mock.calls.find(
      (call: any) => call[0].type === "tests/setAvailableVersions",
    );

    expect(setAvailableVersionsCall[0].payload).toEqual(["3.5.1", "3.4.0"]);
  });

  it("should limit to 50 versions", async () => {
    const versions: Record<string, {}> = {};
    for (let i = 0; i < 100; i++) {
      versions[`${i}.0.0`] = {};
    }

    const mockRegistry = { versions };

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockRegistry,
    });

    await loadRechartsVersions(mockDispatch);

    const setAvailableVersionsCall = (mockDispatch as any).mock.calls.find(
      (call: any) => call[0].type === "tests/setAvailableVersions",
    );

    expect(setAvailableVersionsCall[0].payload.length).toBe(50);
  });

  it("should handle fetch errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockError = new Error("Network error");
    (global.fetch as any).mockRejectedValueOnce(mockError);

    await loadRechartsVersions(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledWith(setLoadingVersions(true));
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to load Recharts versions:",
      mockError,
    );
    expect(mockDispatch).toHaveBeenCalledWith(setLoadingVersions(false));

    consoleSpy.mockRestore();
  });
});
