import { describe, expect, it } from "vitest";
import { estimateBooking } from "./booking-pricing";

const f = { rateKariah: 70000, rateAwam: 150000, deposit: 30000 };

describe("estimateBooking", () => {
  it("uses kariah rate when isKariah", () => {
    expect(estimateBooking(f, true)).toEqual({ rate: 70000, deposit: 30000, total: 100000 });
  });
  it("uses awam rate otherwise", () => {
    expect(estimateBooking(f, false)).toEqual({ rate: 150000, deposit: 30000, total: 180000 });
  });
  it("falls back to awam when kariah rate is 0", () => {
    expect(estimateBooking({ rateKariah: 0, rateAwam: 150000, deposit: 0 }, true).rate).toBe(150000);
  });
});
