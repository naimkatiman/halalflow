import { describe, expect, it } from "vitest";
import {
  BOOKING_STATUSES,
  canTransition,
  resolveAction,
  validateActionInput,
} from "./bookings";

describe("canTransition", () => {
  it("allows the six legal transitions", () => {
    expect(canTransition("requested", "approved")).toBe(true);
    expect(canTransition("requested", "declined")).toBe(true);
    expect(canTransition("requested", "cancelled")).toBe(true);
    expect(canTransition("approved", "paid")).toBe(true);
    expect(canTransition("approved", "cancelled")).toBe(true);
    expect(canTransition("paid", "completed")).toBe(true);
  });

  it("rejects every other pair", () => {
    const legal = new Set([
      "requested>approved", "requested>declined", "requested>cancelled",
      "approved>paid", "approved>cancelled", "paid>completed",
    ]);
    for (const from of BOOKING_STATUSES) {
      for (const to of BOOKING_STATUSES) {
        if (!legal.has(`${from}>${to}`)) {
          expect(canTransition(from, to), `${from}>${to}`).toBe(false);
        }
      }
    }
  });
});

describe("resolveAction", () => {
  it("maps actions to target statuses", () => {
    expect(resolveAction("approve")).toBe("approved");
    expect(resolveAction("decline")).toBe("declined");
    expect(resolveAction("record_payment")).toBe("paid");
    expect(resolveAction("complete")).toBe("completed");
    expect(resolveAction("cancel")).toBe("cancelled");
  });
});

describe("validateActionInput", () => {
  it("approve requires a positive quotedAmount", () => {
    expect(validateActionInput("approve", {}).ok).toBe(false);
    expect(validateActionInput("approve", { quotedAmount: 0 }).ok).toBe(false);
    expect(validateActionInput("approve", { quotedAmount: 150000 }).ok).toBe(true);
  });
  it("decline requires a reason", () => {
    expect(validateActionInput("decline", {}).ok).toBe(false);
    expect(validateActionInput("decline", { declineReason: "Tarikh penuh" }).ok).toBe(true);
  });
  it("record_payment requires a positive paymentAmount", () => {
    expect(validateActionInput("record_payment", {}).ok).toBe(false);
    expect(validateActionInput("record_payment", { paymentAmount: 70000 }).ok).toBe(true);
  });
  it("complete and cancel need no extras", () => {
    expect(validateActionInput("complete", {}).ok).toBe(true);
    expect(validateActionInput("cancel", {}).ok).toBe(true);
  });
});
