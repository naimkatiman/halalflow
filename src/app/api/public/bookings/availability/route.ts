import { NextRequest, NextResponse } from "next/server";
import { prismaAdmin } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { BLOCKING_STATUSES } from "@/lib/availability";
import { z } from "zod";

const q = z.object({
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
    facilityId: request.nextUrl.searchParams.get("facilityId"),
    date: request.nextUrl.searchParams.get("date"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const day = new Date(parsed.data.date + "T00:00:00Z");
  const rows = await prismaAdmin.facilityBooking.findMany({
    where: { facilityId: parsed.data.facilityId, eventDate: day, status: { in: [...BLOCKING_STATUSES] } },
    select: { startTime: true, endTime: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({ data: { occupied: rows } }, { headers: { "Cache-Control": "no-store" } });
}
