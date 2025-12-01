import { describe, it, expect } from "vitest";
import { formatDuration } from "../../src/utils/formatDuration";

describe("formatDuration", () => {
  it("should format seconds only", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(999)).toBe("0s");
    expect(formatDuration(1000)).toBe("1s");
    expect(formatDuration(5000)).toBe("5s");
    expect(formatDuration(59000)).toBe("59s");
  });

  it("should format duration less than 1 second", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(500)).toBe("0s");
    expect(formatDuration(999)).toBe("0s");
  });

  it("should format minutes and seconds", () => {
    expect(formatDuration(60000)).toBe("1m 0s");
    expect(formatDuration(61000)).toBe("1m 1s");
    expect(formatDuration(90000)).toBe("1m 30s");
    expect(formatDuration(125000)).toBe("2m 5s");
    expect(formatDuration(3599000)).toBe("59m 59s");
  });

  it("should format hours and minutes", () => {
    expect(formatDuration(3600000)).toBe("1h 0m");
    expect(formatDuration(3660000)).toBe("1h 1m");
    expect(formatDuration(5400000)).toBe("1h 30m");
    expect(formatDuration(7200000)).toBe("2h 0m");
    expect(formatDuration(7380000)).toBe("2h 3m");
  });

  it("should handle large durations", () => {
    expect(formatDuration(36000000)).toBe("10h 0m");
    expect(formatDuration(86400000)).toBe("24h 0m");
  });

  it("should truncate to whole units", () => {
    // 1 minute 30.5 seconds should display as "1m 30s"
    expect(formatDuration(90500)).toBe("1m 30s");

    // 1 hour 30 minutes 45 seconds should display as "1h 30m"
    expect(formatDuration(5445000)).toBe("1h 30m");
  });

  it("should handle undefined", () => {
    expect(formatDuration(undefined)).toBe("-");
  });
});
