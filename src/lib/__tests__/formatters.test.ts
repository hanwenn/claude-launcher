import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatDate, truncateSummary, formatPath } from "../formatters";

describe("formatDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-28T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns '刚刚' for timestamps seconds ago", () => {
    const tenSecondsAgo = new Date("2026-03-28T11:59:50Z").toISOString();
    expect(formatDate(tenSecondsAgo)).toBe("刚刚");
  });

  it("returns minutes ago for timestamps within the last hour", () => {
    const fiveMinAgo = new Date("2026-03-28T11:55:00Z").toISOString();
    expect(formatDate(fiveMinAgo)).toBe("5分钟前");
  });

  it("returns hours ago for timestamps within the last day", () => {
    const threeHoursAgo = new Date("2026-03-28T09:00:00Z").toISOString();
    expect(formatDate(threeHoursAgo)).toBe("3小时前");
  });

  it("returns '昨天' for timestamps from yesterday", () => {
    const yesterday = new Date("2026-03-27T12:00:00Z").toISOString();
    expect(formatDate(yesterday)).toBe("昨天");
  });

  it("returns days ago for 2-6 days", () => {
    const threeDaysAgo = new Date("2026-03-25T12:00:00Z").toISOString();
    expect(formatDate(threeDaysAgo)).toBe("3天前");
  });

  it("returns weeks ago for 7-29 days", () => {
    const twoWeeksAgo = new Date("2026-03-14T12:00:00Z").toISOString();
    expect(formatDate(twoWeeksAgo)).toBe("2周前");
  });

  it("returns full date for 30+ days ago", () => {
    const oldDate = new Date("2025-12-15T08:30:00Z").toISOString();
    const result = formatDate(oldDate);
    // The exact output depends on local timezone, but should contain 2025-12
    expect(result).toMatch(/^2025-12-\d{2} \d{2}:\d{2}$/);
  });

  it("returns '未知时间' for empty string", () => {
    expect(formatDate("")).toBe("未知时间");
  });

  it("returns '未知时间' for invalid string 'abc'", () => {
    expect(formatDate("abc")).toBe("未知时间");
  });

  it("returns '未知时间' for non-date content", () => {
    expect(formatDate("not-a-date")).toBe("未知时间");
  });
});

describe("truncateSummary", () => {
  it("returns short text unchanged (no truncation needed)", () => {
    expect(truncateSummary("hello", 80)).toBe("hello");
  });

  it("truncates long text and appends '...'", () => {
    const longText = "a".repeat(100);
    const result = truncateSummary(longText, 80);
    expect(result).toBe("a".repeat(80) + "...");
    expect(result.length).toBe(83);
  });

  it("returns empty string unchanged", () => {
    expect(truncateSummary("")).toBe("");
  });

  it("does not truncate text at exact boundary", () => {
    const exactText = "a".repeat(80);
    expect(truncateSummary(exactText, 80)).toBe(exactText);
  });

  it("truncates text one character over boundary", () => {
    const overByOne = "a".repeat(81);
    expect(truncateSummary(overByOne, 80)).toBe("a".repeat(80) + "...");
  });

  it("uses default maxLen of 80", () => {
    const shortText = "a".repeat(80);
    expect(truncateSummary(shortText)).toBe(shortText);

    const longText = "a".repeat(81);
    expect(truncateSummary(longText)).toBe("a".repeat(80) + "...");
  });
});

describe("formatPath", () => {
  it("returns last 2 segments of a normal Windows path", () => {
    expect(formatPath("D:\\Users\\guanzhe\\project")).toBe("guanzhe/project");
  });

  it("returns drive root as single segment", () => {
    expect(formatPath("C:\\")).toBe("C:");
  });

  it("returns single segment path as-is", () => {
    expect(formatPath("project")).toBe("project");
  });

  it("handles forward slashes", () => {
    expect(formatPath("D:/Users/guanzhe/project")).toBe("guanzhe/project");
  });

  it("handles two-segment path", () => {
    expect(formatPath("D:\\project")).toBe("D:/project");
  });
});
