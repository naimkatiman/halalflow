import { zodErrorMessage } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prismaAdmin } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { EVENT_TYPES } from "@/lib/bookings";
import { generateReference, generatePublicToken } from "@/lib/booking-codes";
import { sendEmail } from "@/lib/notifications/email";
import {
  buildBookingRequestCustomerEmail,
  buildBookingRequestOfficeEmail,
} from "@/lib/notifications/booking-email";
import { z } from "zod";

const publicBookingSchema = z.object({
  slug: z.string().trim().min(1).max(100),
  facilityId: z.string().trim().min(1).max(50),
  eventType: z.enum(EVENT_TYPES),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  pax: z.number().int().min(1).max(100000),
  applicantName: z.string().trim().min(1).max(160),
  applicantPhone: z.string().trim().min(6).max(30),
  applicantEmail: z
    .string()
    .trim()
    .email()
    .max(200)
    .optional()
    .or(z.literal("")),
  isKariah: z.boolean().default(false),
  notes: z.string().trim().max(2000).optional(),
  // Honeypot: bots fill hidden fields; humans never see it. Accept any value so
  // a filled field still parses and hits the silent fake-success branch below
  // (a strict .max(0) would 400 and reveal the trap).
  website: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limit by IP
    // Railway appends the real client IP as the rightmost XFF entry; leftmost entries are client-supplied
    const ip =
      request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
      "unknown";
    const rateLimit = checkRateLimit("public-booking:" + ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // 2. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    let parsed: z.infer<typeof publicBookingSchema>;
    try {
      parsed = publicBookingSchema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: zodErrorMessage(err) },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }
      throw err;
    }

    // 2b. Honeypot: a filled hidden field means a bot. Return a fake success so
    // the bot gets no signal; no DB write happens.
    if (parsed.website) {
      return NextResponse.json(
        { data: { reference: "TEMPAH00", token: "x" } },
        { status: 201, headers: { "Cache-Control": "no-store" } },
      );
    }

    // 3. Validate date and time windows (Malaysia calendar; YYYY-MM-DD and
    // zero-padded HH:MM compare correctly as strings)
    const klDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kuala_Lumpur",
    });
    const todayKL = klDate.format(new Date());
    if (parsed.eventDate < todayKL) {
      return NextResponse.json(
        { error: "Tarikh telah lepas" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    const maxKL = klDate.format(new Date(Date.now() + 730 * 86400000));
    if (parsed.eventDate > maxKL) {
      return NextResponse.json(
        { error: "Tarikh terlalu jauh" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (parsed.endTime <= parsed.startTime) {
      return NextResponse.json(
        { error: "Masa tamat mesti selepas masa mula" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    // 4. Resolve org from slug; must be published
    const org = await prismaAdmin.organization.findUnique({
      where: { slug: parsed.slug },
      select: {
        id: true,
        mosqueProfile: { select: { published: true, displayName: true } },
      },
    });
    if (!org || !org.mosqueProfile?.published) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    // 5. Verify facility belongs to org and is active
    const facility = await prismaAdmin.facility.findFirst({
      where: { id: parsed.facilityId, orgId: org.id, active: true },
    });
    if (!facility) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    // 5b. Capacity guard
    if (facility.capacity > 0 && parsed.pax > facility.capacity) {
      return NextResponse.json(
        { error: `Bilangan tetamu melebihi kapasiti (${facility.capacity} pax)` },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    // 6. Create booking — slug is not a booking column; orgId resolved server-side.
    // reference + publicToken are unique; re-roll BOTH on the rare collision (P2002).
    let booking: Awaited<ReturnType<typeof prismaAdmin.facilityBooking.create>> | undefined;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        booking = await prismaAdmin.facilityBooking.create({
          data: {
            orgId: org.id,
            facilityId: parsed.facilityId,
            eventType: parsed.eventType,
            // Midnight UTC keeps the calendar date stable under UTC server rendering
            eventDate: new Date(parsed.eventDate + "T00:00:00Z"),
            startTime: parsed.startTime,
            endTime: parsed.endTime,
            pax: parsed.pax,
            applicantName: parsed.applicantName,
            applicantPhone: parsed.applicantPhone,
            applicantEmail: parsed.applicantEmail || null,
            isKariah: parsed.isKariah,
            notes: parsed.notes,
            status: "requested",
            reference: generateReference(),
            publicToken: generatePublicToken(),
          },
        });
        break;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
        throw e;
      }
    }
    if (!booking) {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }

    // 7. Notify customer + office (best-effort — never fail the request on email)
    const members = await prismaAdmin.orgMember.findMany({
      where: { orgId: org.id, role: { in: ["owner", "admin"] } },
      select: { user: { select: { email: true } } },
    });
    const officeEmails = members.map((m) => m.user.email).filter(Boolean);
    try {
      if (parsed.applicantEmail) {
        await sendEmail(
          buildBookingRequestCustomerEmail({
            to: parsed.applicantEmail,
            reference: booking.reference,
            slug: parsed.slug,
            token: booking.publicToken,
            mosqueName: org.mosqueProfile.displayName,
            facilityName: facility.name,
            eventDate: parsed.eventDate,
          }),
        );
      }
      if (officeEmails.length) {
        await sendEmail(
          buildBookingRequestOfficeEmail({
            to: officeEmails,
            reference: booking.reference,
            bookingId: booking.id,
            mosqueName: org.mosqueProfile.displayName,
            facilityName: facility.name,
            eventDate: parsed.eventDate,
            startTime: parsed.startTime,
            endTime: parsed.endTime,
            pax: parsed.pax,
            applicantName: parsed.applicantName,
            applicantPhone: parsed.applicantPhone,
          }),
        );
      }
    } catch (e) {
      console.error("booking email error:", e);
    }

    // 8. Return reference + token (token drives the customer status URL)
    return NextResponse.json(
      { data: { reference: booking.reference, token: booking.publicToken } },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("POST /api/public/bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
