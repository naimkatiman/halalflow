import { describe, expect, it } from "vitest";
import { generateReference, generatePublicToken, REFERENCE_ALPHABET } from "./booking-codes";

describe("generateReference", () => {
  it("is 8 chars from the unambiguous alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const r = generateReference();
      expect(r).toHaveLength(8);
      for (const ch of r) expect(REFERENCE_ALPHABET).toContain(ch);
    }
  });
  it("is overwhelmingly unique across many draws", () => {
    const seen = new Set(Array.from({ length: 2000 }, () => generateReference()));
    expect(seen.size).toBeGreaterThan(1990);
  });
});

describe("generatePublicToken", () => {
  it("is a long url-safe token", () => {
    const t = generatePublicToken();
    expect(t.length).toBeGreaterThanOrEqual(32);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
