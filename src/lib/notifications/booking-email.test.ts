import { describe, expect, it } from "vitest";
import {
  buildBookingRequestCustomerEmail,
  buildBookingRequestOfficeEmail,
  buildBookingApprovedCustomerEmail,
  buildBookingReceiptOfficeEmail,
  buildBookingConfirmedCustomerEmail,
  bookingStatusUrl,
} from "./booking-email";

describe("booking emails", () => {
  it("customer request email carries reference + status link", () => {
    const m = buildBookingRequestCustomerEmail({
      to: "a@b.com", reference: "ABCD2345", slug: "al-noor-trust", token: "tok123",
      mosqueName: "Masjid Al-Noor", facilityName: "Dewan", eventDate: "2026-07-01",
    });
    expect(m.to).toBe("a@b.com");
    expect(m.subject).toContain("ABCD2345");
    expect(m.text).toContain(bookingStatusUrl("al-noor-trust", "tok123"));
  });

  it("office request email carries an admin link to the booking", () => {
    const m = buildBookingRequestOfficeEmail({
      to: ["office@b.com"], reference: "ABCD2345", bookingId: "bk_1", mosqueName: "M",
      facilityName: "Dewan", eventDate: "2026-07-01", startTime: "09:00", endTime: "17:00",
      pax: 120, applicantName: "Ali", applicantPhone: "0123456789",
    });
    expect(m.text).toContain("bk_1");
    expect(m.text).toContain("Ali");
  });

  it("approved email mentions the amount to pay", () => {
    const m = buildBookingApprovedCustomerEmail({
      to: "a@b.com", reference: "ABCD2345", slug: "s", token: "t", mosqueName: "M", amountDueSen: 30000,
    });
    expect(m.text).toContain("RM");
  });

  it("receipt office email references the booking", () => {
    const m = buildBookingReceiptOfficeEmail({
      to: ["office@b.com"], reference: "ABCD2345", bookingId: "bk_1", mosqueName: "M",
      applicantName: "Ali", facilityName: "Dewan",
    });
    expect(m.subject).toContain("ABCD2345");
    expect(m.text).toContain("bk_1");
  });

  it("confirmed email confirms the booking", () => {
    const m = buildBookingConfirmedCustomerEmail({
      to: "a@b.com", reference: "ABCD2345", slug: "s", token: "t", mosqueName: "M",
    });
    expect(m.subject.toLowerCase()).toContain("disahkan");
  });
});
