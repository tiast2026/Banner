import { describe, it, expect } from "vitest";
import { formatPrice, formatPercent, formatPeriod, formatFieldValue } from "@/lib/format";

describe("formatPrice", () => {
  it("formats number with comma and suffix", () => {
    expect(formatPrice("3580", "円")).toBe("3,580円");
  });

  it("formats large number", () => {
    expect(formatPrice("1234567", "円")).toBe("1,234,567円");
  });

  it("uses default suffix 円 when empty", () => {
    expect(formatPrice("1000", "")).toBe("1,000円");
  });

  it("returns raw value for non-numeric input", () => {
    expect(formatPrice("abc", "円")).toBe("abc");
  });
});

describe("formatPercent", () => {
  it("returns value as-is", () => {
    expect(formatPercent("20")).toBe("20");
  });
});

describe("formatPeriod", () => {
  it("formats date range with day of week", () => {
    // 2025-03-04 is Tuesday (火), 2025-03-11 is Tuesday (火)
    const result = formatPeriod("2025-03-04", "20:00", "2025-03-11", "01:59");
    expect(result).toBe("3/4(火)20:00〜3/11(火)01:59");
  });

  it("returns empty for invalid dates", () => {
    expect(formatPeriod("invalid", "20:00", "2025-03-11", "01:59")).toBe("");
  });
});

describe("formatFieldValue", () => {
  it("dispatches price type correctly", () => {
    expect(formatFieldValue("price", "3580", "円")).toBe("3,580円");
  });

  it("dispatches percent type correctly", () => {
    expect(formatFieldValue("percent", "20", "")).toBe("20");
  });

  it("dispatches text type with suffix", () => {
    expect(formatFieldValue("text", "hello", "!")).toBe("hello!");
  });

  it("dispatches period type with allValues", () => {
    const allValues = {
      startDate: "2025-03-04",
      startTime: "20:00",
      endDate: "2025-03-11",
      endTime: "01:59",
    };
    const result = formatFieldValue("period", "", "", allValues);
    expect(result).toBe("3/4(火)20:00〜3/11(火)01:59");
  });
});
