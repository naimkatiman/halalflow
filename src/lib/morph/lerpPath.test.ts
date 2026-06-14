import { describe, it, expect } from "vitest";
import { lerpPath } from "./lerpPath";

describe("lerpPath", () => {
  it("returns state A at t=0", () => {
    expect(lerpPath("M 0 0 L 10 10", "M 0 0 L 20 20", 0)).toBe("M 0 0 L 10 10");
  });

  it("returns state B at t=1", () => {
    expect(lerpPath("M 0 0 L 10 10", "M 0 0 L 20 20", 1)).toBe("M 0 0 L 20 20");
  });

  it("interpolates numbers at the midpoint", () => {
    expect(lerpPath("M 0 0 L 10 10", "M 0 0 L 20 20", 0.5)).toBe("M 0 0 L 15 15");
  });

  it("interpolates negative and decimal coordinates", () => {
    expect(lerpPath("M -1.5 0", "M 0.5 0", 0.5)).toBe("M -0.5 0");
  });

  it("preserves command letters in the output", () => {
    const out = lerpPath("M 0 0 C 1 1 2 2 3 3", "M 0 0 C 5 5 6 6 7 7", 0);
    expect(out).toBe("M 0 0 C 1 1 2 2 3 3");
  });

  it("handles multiple subpaths (matched structure)", () => {
    const a = "M 0 0 L 10 0 M 0 10 L 10 10";
    const b = "M 0 0 L 20 0 M 0 20 L 20 20";
    expect(lerpPath(a, b, 0.5)).toBe("M 0 0 L 15 0 M 0 15 L 15 15");
  });

  it("throws when paths have different token counts", () => {
    expect(() => lerpPath("M 0 0", "M 0 0 L 1 1", 0.5)).toThrow(/structure/i);
  });

  it("throws when command letters differ at the same position", () => {
    expect(() => lerpPath("M 0 0 L 10 10", "L 0 0 L 10 10", 0.5)).toThrow(/command/i);
  });

  it("tolerates comma and tight separators in input", () => {
    expect(lerpPath("M0,0 L10,10", "M0,0 L20,20", 0.5)).toBe("M 0 0 L 15 15");
  });
});
