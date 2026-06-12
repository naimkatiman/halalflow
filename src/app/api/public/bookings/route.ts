import { zodErrorMessage } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { prismaAdmin } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { EVENT_TYPES } from "@/lib/bookings";
import { z } from "zod";

const publicBookingSchema = z.object({
  slug: z.string().trim().min(1).max(100),
  facilityId: z.string().trim().min(1).max(50),
  eventType: z.enum(EVENT_TYPES),
  eventDate: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
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
});

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
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
    const body = await request.json();
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

    // 3. Reject past dates (date-only comparison)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDay = new Date(parsed.eventDate);
    eventDay.setHours(0, 0, 0, 0);
    if (eventDay < today) {
      return NextResponse.json(
        { error: "Tarikh telah lepas" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    // 4. Resolve org from slug; must be published
    const org = await prismaAdmin.organization.findUnique({
      where: { slug: parsed.slug },
      select: {
        id: true,
        mosqueProfile: { select: { published: true } },
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

    // 6. Create booking — slug is not a booking column; orgId resolved server-side
    const booking = await prismaAdmin.facilityBooking.create({
      data: {
        orgId: org.id,
        facilityId: parsed.facilityId,
        eventType: parsed.eventType,
        eventDate: parsed.eventDate,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        pax: parsed.pax,
        applicantName: parsed.applicantName,
        applicantPhone: parsed.applicantPhone,
        applicantEmail: parsed.applicantEmail || null,
        isKariah: parsed.isKariah,
        notes: parsed.notes,
        status: "requested",
      },
    });

    // 7. Return short reference
    return NextResponse.json(
      { data: { reference: booking.id.slice(0, 8).toUpperCase() } },
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
