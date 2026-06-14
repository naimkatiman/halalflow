import { NextRequest, NextResponse } from "next/server";
import { prismaAdmin } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { BLOCKING_STATUSES } from "@/lib/availability";
import { z } from "zod";

const q = z.object({
  slug: z.string().trim().min(1).max(100),
  facilityId: z.string().trim().min(1).max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Occupied time ranges for a facility on a date — drives the wizard's slot hints. */
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "unknown";
  if (!checkRateLimit("availability:" + ip).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Cache-Control": "no-store" } });
  }

  const parsed = q.safeParse({
    slug: request.nextUrl.searchParams.get("slug"),
    facilityId: request.nextUrl.searchParams.get("facilityId"),
    date: request.nextUrl.searchParams.get("date"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  // Bind the facility to the published mosque being browsed — prismaAdmin bypasses
  // RLS, so occupancy must be scoped in code (mirror the booking POST guard).
  const org = await prismaAdmin.organization.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true, mosqueProfile: { select: { published: true } } },
  });
  if (!org || !org.mosqueProfile?.published) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const facility = await prismaAdmin.facility.findFirst({
    where: { id: parsed.data.facilityId, orgId: org.id, active: true },
    select: { id: true },
  });
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const day = new Date(parsed.data.date + "T00:00:00Z");
  const rows = await prismaAdmin.facilityBooking.findMany({
    where: { facilityId: parsed.data.facilityId, orgId: org.id, eventDate: day, status: { in: [...BLOCKING_STATUSES] } },
    select: { startTime: true, endTime: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({ data: { occupied: rows } }, { headers: { "Cache-Control": "no-store" } });
}
