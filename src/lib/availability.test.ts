import { describe, expect, it } from "vitest";
import { timeRangesOverlap, BLOCKING_STATUSES } from "./availability";

describe("timeRangesOverlap", () => {
  it("detects overlap", () => {
    expect(timeRangesOverlap("09:00", "12:00", "11:00", "13:00")).toBe(true);
  });
  it("treats touching ranges as non-overlapping", () => {
    expect(timeRangesOverlap("09:00", "12:00", "12:00", "14:00")).toBe(false);
  });
  it("detects containment", () => {
    expect(timeRangesOverlap("08:00", "18:00", "10:00", "11:00")).toBe(true);
  });
  it("non-overlap when fully before", () => {
    expect(timeRangesOverlap("09:00", "10:00", "10:30", "11:00")).toBe(false);
  });
});

describe("BLOCKING_STATUSES", () => {
  it("includes the four confirmed-side statuses", () => {
    expect([...BLOCKING_STATUSES].sort()).toEqual(
      ["approved", "completed", "paid", "payment_review"].sort(),
    );
  });
});
