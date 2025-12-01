import { describe, it, expect } from "vitest";
import { formatDuration } from "../../src/utils/formatDuration";

describe("formatDuration", () => {
  it("should format duration less than 1 second", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(500)).toBe("0s");
    expect(formatDuration(999)).toBe("0s");
  });

  it("should format duration in seconds", () => {
    expect(formatDuration(1000)).toBe("1s");
    expect(formatDuration(5000)).toBe("5s");
    expect(formatDuration(59999)).toBe("59s");
  });

  it("should format duration in minutes and seconds", () => {
    expect(formatDuration(60000)).toBe("1m 0s");
    expect(formatDuration(61000)).toBe("1m 1s");
    expect(formatDuration(125000)).toBe("2m 5s");
    expect(formatDuration(3599999)).toBe("59m 59s");
  });

  it("should format duration in hours and minutes", () => {
    expect(formatDuration(3600000)).toBe("1h 0m");
    expect(formatDuration(3661000)).toBe("1h 1m");
    expect(formatDuration(7325000)).toBe("2h 2m");
  });

  it("should handle undefined", () => {
    expect(formatDuration(undefined)).toBe("-");
  });
});
