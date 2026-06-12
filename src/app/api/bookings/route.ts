import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { isOrgSubscribed } from "@/lib/require-subscription";
import { BOOKING_STATUSES } from "@/lib/bookings";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!(await isOrgSubscribed(session.orgId))) return NextResponse.json({ error: "Subscription required" }, { status: 402, headers: { "Cache-Control": "no-store" } });

    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get("status") ?? "";
    const status = (BOOKING_STATUSES as ReadonlyArray<string>).includes(rawStatus) ? rawStatus : null;
    const page = Math.max(1, Math.floor(Number(searchParams.get("page")) || 1));

    const { bookings, total } = await withOrg(session.orgId, async (tx) => {
      const where = { orgId: session.orgId, ...(status ? { status } : {}) };
      const [bookings, total] = await Promise.all([
        tx.facilityBooking.findMany({
          where,
          include: { facility: { select: { name: true, type: true } } },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        tx.facilityBooking.count({ where }),
      ]);
      return { bookings, total };
    });

    return NextResponse.json(
      { data: bookings, pagination: { page, limit: PAGE_SIZE, total, pages: Math.ceil(total / PAGE_SIZE) } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
