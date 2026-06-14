import { NextRequest, NextResponse } from "next/server";
import { prismaAdmin } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateImageUpload, MAX_UPLOAD_BYTES } from "@/lib/upload";
import { sendEmail } from "@/lib/notifications/email";
import { buildBookingReceiptOfficeEmail } from "@/lib/notifications/booking-email";

const json = (b: unknown, status = 200) =>
  NextResponse.json(b, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Customer uploads a payment receipt (token-gated, no login). Validates the
 * image, stores it, and CAS-transitions approved -> payment_review, then
 * notifies the office. prismaAdmin: org is resolved from the booking, not a
 * session.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "unknown";
    if (!checkRateLimit("receipt:" + ip).allowed) return json({ error: "Too many requests" }, 429);

    const { token } = await params;
    const booking = await prismaAdmin.facilityBooking.findUnique({
      where: { publicToken: token },
      select: {
        id: true, orgId: true, status: true, reference: true, applicantName: true,
        receiptImageId: true,
        facility: { select: { name: true } },
        org: {
          select: {
            members: {
              where: { role: { in: ["owner", "admin"] } },
              select: { user: { select: { email: true } } },
            },
            mosqueProfile: { select: { displayName: true } },
          },
        },
      },
    });
    if (!booking) return json({ error: "Not found" }, 404);
    // Allow first upload (approved) and replacement while still under review.
    if (booking.status !== "approved" && booking.status !== "payment_review") {
      return json({ error: "Tempahan ini belum sedia untuk muat naik resit" }, 409);
    }

    // Reject oversized bodies before buffering them into memory.
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_UPLOAD_BYTES + 1024) {
      return json({ error: "Saiz fail melebihi 5 MB" }, 413);
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Tiada fail" }, 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = validateImageUpload(bytes, file.type);
    if (!check.ok) return json({ error: check.error }, 400);

    const img = await prismaAdmin.uploadedImage.create({
      data: { orgId: booking.orgId, mime: check.mime, sizeBytes: bytes.length, data: Buffer.from(bytes) },
    });
    const updated = await prismaAdmin.facilityBooking.updateMany({
      where: { id: booking.id, status: booking.status },
      data: { status: "payment_review", receiptImageId: img.id, receiptUploadedAt: new Date() },
    });
    if (updated.count === 0) {
      await prismaAdmin.uploadedImage.deleteMany({ where: { id: img.id } });
      return json({ error: "Tempahan telah dikemaskini" }, 409);
    }
    // On re-upload, drop the previously attached (now-orphaned) receipt bytes.
    if (booking.receiptImageId && booking.receiptImageId !== img.id) {
      await prismaAdmin.uploadedImage.deleteMany({ where: { id: booking.receiptImageId } });
    }

    const officeEmails = booking.org.members.map((m) => m.user.email).filter(Boolean);
    try {
      if (officeEmails.length) {
        await sendEmail(
          buildBookingReceiptOfficeEmail({
            to: officeEmails,
            reference: booking.reference,
            bookingId: booking.id,
            mosqueName: booking.org.mosqueProfile?.displayName ?? "",
            applicantName: booking.applicantName,
            facilityName: booking.facility.name,
          }),
        );
      }
    } catch (e) {
      console.error("receipt email error:", e);
    }

    return json({ data: { status: "payment_review" } }, 201);
  } catch (error) {
    console.error("POST /api/public/bookings/[token]/receipt error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}
