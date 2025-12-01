import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadVersions } from "../../src/hooks/useLoadVersions";

global.fetch = vi.fn();

describe("loadVersions", () => {
  let mockSetVersions: (versions: { node: string; npm: string; yarn: string }) => void;

  beforeEach(() => {
    mockSetVersions = vi.fn();
    vi.clearAllMocks();
  });

  it("should successfully load versions", async () => {
    const mockVersions = {
      node: "v22.0.0",
      npm: "10.0.0",
      yarn: "1.22.0",
    };

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockVersions,
    });

    await loadVersions(mockSetVersions);

    expect(global.fetch).toHaveBeenCalledWith("/api/versions");
    expect(mockSetVersions).toHaveBeenCalledWith(mockVersions);
  });

  it("should handle fetch errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockError = new Error("Network error");
    (global.fetch as any).mockRejectedValueOnce(mockError);

    await loadVersions(mockSetVersions);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to load versions:",
      mockError,
    );
    expect(mockSetVersions).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
