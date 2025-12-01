import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { useLoadAllInfo } from "../../src/hooks/useLoadAllInfo";
import * as loadTestsModule from "../../src/hooks/useLoadTests";
import * as loadPersistedResultsModule from "../../src/hooks/useLoadPersistedResults";
import * as loadRechartsVersionsModule from "../../src/hooks/useLoadRechartsVersions";
import * as loadPersistedPackingDirectoryModule from "../../src/hooks/useLoadPersistedPackingDirectory";
import * as loadVersionsModule from "../../src/hooks/useLoadVersions";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import testsReducer from "../../src/store/testsSlice";

// Mock all the load functions
vi.mock("../../src/hooks/useLoadTests");
vi.mock("../../src/hooks/useLoadPersistedResults");
vi.mock("../../src/hooks/useLoadRechartsVersions");
vi.mock("../../src/hooks/useLoadPersistedPackingDirectory");
vi.mock("../../src/hooks/useLoadVersions");

describe("useLoadAllInfo", () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        tests: testsReducer,
      },
    });

    vi.clearAllMocks();

    // Mock all load functions
    vi.spyOn(loadTestsModule, "loadTests").mockResolvedValue(undefined);
    vi.spyOn(loadPersistedResultsModule, "loadPersistedResultsFromStorage").mockImplementation(() => {});
    vi.spyOn(loadRechartsVersionsModule, "loadRechartsVersions").mockResolvedValue(undefined);
    vi.spyOn(loadPersistedPackingDirectoryModule, "loadPersistedPackingDirectory").mockImplementation(() => {});
    vi.spyOn(loadVersionsModule, "loadVersions").mockResolvedValue(undefined);
  });

  it("should call all load functions on mount", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    renderHook(() => useLoadAllInfo(), { wrapper });

    await waitFor(() => {
      expect(loadTestsModule.loadTests).toHaveBeenCalledTimes(1);
      expect(loadPersistedResultsModule.loadPersistedResultsFromStorage).toHaveBeenCalledTimes(1);
      expect(loadRechartsVersionsModule.loadRechartsVersions).toHaveBeenCalledTimes(1);
      expect(loadPersistedPackingDirectoryModule.loadPersistedPackingDirectory).toHaveBeenCalledTimes(1);
      expect(loadVersionsModule.loadVersions).toHaveBeenCalledTimes(1);
    });
  });

  it("should return versions state", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useLoadAllInfo(), { wrapper });

    expect(result.current).toHaveProperty("versions");
  });
});
