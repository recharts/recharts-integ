import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadPersistedPackingDirectory } from "../../src/hooks/useLoadPersistedPackingDirectory";
import {
  setPackingDirectory,
  setLocalPackagePath,
} from "../../src/store/testsSlice";
import type { AppDispatch } from "../../src/store";

describe("loadPersistedPackingDirectory", () => {
  let mockDispatch: AppDispatch;

  beforeEach(() => {
    mockDispatch = vi.fn() as unknown as AppDispatch;
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should load persisted directory and package path from localStorage", () => {
    const mockDirectory = "/path/to/directory";
    const mockPackagePath = "/path/to/package.tgz";

    localStorage.setItem("packingDirectory", mockDirectory);
    localStorage.setItem("localPackagePath", mockPackagePath);

    loadPersistedPackingDirectory(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledWith(
      setPackingDirectory(mockDirectory),
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      setLocalPackagePath(mockPackagePath),
    );
  });

  it("should handle empty localStorage", () => {
    loadPersistedPackingDirectory(mockDispatch);

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("should handle only directory in localStorage", () => {
    const mockDirectory = "/path/to/directory";
    localStorage.setItem("packingDirectory", mockDirectory);

    loadPersistedPackingDirectory(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledWith(
      setPackingDirectory(mockDirectory),
    );
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it("should handle only package path in localStorage", () => {
    const mockPackagePath = "/path/to/package.tgz";
    localStorage.setItem("localPackagePath", mockPackagePath);

    loadPersistedPackingDirectory(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledWith(
      setLocalPackagePath(mockPackagePath),
    );
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});
