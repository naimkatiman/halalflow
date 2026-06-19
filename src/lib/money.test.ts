import { describe, expect, it } from "vitest";
import { formatMYR, parseRmToSen } from "./money";

describe("formatMYR", () => {
  it("returns a string for a range of sen values", () => {
    for (const sen of [0, 1, 150000, 999, 1234567]) {
      expect(typeof formatMYR(sen)).toBe("string");
    }
  });

  it("always shows exactly 2 fraction digits", () => {
    // ms-MY uses '.' as the decimal separator; assert two trailing fraction digits.
    for (const sen of [0, 1, 150000, 999, 1234567]) {
      expect(/[.,]\d{2}$/.test(formatMYR(sen))).toBe(true);
    }
  });

  it("groups thousands in the integer part", () => {
    const result = formatMYR(150000); // 1500.00
    // Structural: the digit content must round-trip to the original sen.
    expect(result.replace(/\D/g, "")).toBe("150000");
    // ms-MY groups with ',' so the integer 1500 renders as 1,500.
    expect(result.includes("1,500")).toBe(true);
  });

  it("formats a small value with a zero integer part", () => {
    const result = formatMYR(1); // 0.01
    expect(result.replace(/[^\d]/g, "")).toBe("001");
    expect(/0[.,]01/.test(result)).toBe(true);
  });

  it("renders negative input differently and preserves digits", () => {
    const negative = formatMYR(-150000);
    expect(typeof negative).toBe("string");
    expect(negative.replace(/\D/g, "")).toBe("150000");
    // Negative formatting differs from the positive form (minus sign or parens),
    // without asserting an ICU/Node-version-specific representation.
    expect(negative).not.toBe(formatMYR(150000));
  });
});

describe("parseRmToSen", () => {
  it("parses whole and decimal RM amounts into sen", () => {
    expect(parseRmToSen("0")).toBe(0);
    expect(parseRmToSen("1500")).toBe(150000);
    expect(parseRmToSen("1500.50")).toBe(150050);
    expect(parseRmToSen("1500.5")).toBe(150050);
    expect(parseRmToSen("0.01")).toBe(1);
  });

  it("rounds half-sen up via Math.round", () => {
    // 0.005 * 100 = 0.5 -> Math.round -> 1
    expect(parseRmToSen("0.005")).toBe(1);
    // 0.004 * 100 = 0.4 -> Math.round -> 0
    expect(parseRmToSen("0.004")).toBe(0);
  });

  it("rejects negatives and non-finite/NaN inputs with null", () => {
    expect(parseRmToSen("-5")).toBe(null); // n < 0 rejected
    expect(parseRmToSen("abc")).toBe(null); // NaN
    expect(parseRmToSen("")).toBe(null); // NaN
    expect(parseRmToSen("Infinity")).toBe(null); // not finite
  });

  it("characterizes Number.parseFloat leniency", () => {
    // parseFloat stops at the first invalid char rather than failing.
    expect(parseRmToSen("1500abc")).toBe(150000);
    // parseFloat skips leading whitespace.
    expect(parseRmToSen("  1500  ")).toBe(150000);
  });
});

describe("round-trip", () => {
  it("parses the numeric content of formatMYR back to the original sen", () => {
    for (const sen of [0, 1, 150000, 999, 1234567]) {
      const formattedNumeric = formatMYR(sen).replace(/[^\d.]/g, "");
      expect(parseRmToSen(formattedNumeric)).toBe(sen);
    }
  });
});
