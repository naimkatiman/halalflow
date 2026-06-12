import { zodErrorMessage } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { isOrgSubscribed } from "@/lib/require-subscription";
import { roleSatisfies } from "@/lib/roles";
import { FACILITY_TYPES } from "@/lib/bookings";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(FACILITY_TYPES),
  capacity: z.number().int().min(0).max(100000).default(0),
  description: z.string().trim().max(2000).optional(),
  photoUrl: z.string().trim().max(500).optional(),
  rateKariah: z.number().int().min(0),
  rateAwam: z.number().int().min(0),
  deposit: z.number().int().min(0).default(0),
  rateNote: z.string().trim().max(200).optional(),
  rules: z.string().trim().max(4000).optional(),
  active: z.boolean().default(true),
});

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!(await isOrgSubscribed(session.orgId))) return NextResponse.json({ error: "Subscription required" }, { status: 402, headers: { "Cache-Control": "no-store" } });

    const data = await withOrg(session.orgId, async (tx) =>
      tx.facility.findMany({
        where: { orgId: session.orgId },
        orderBy: { createdAt: "asc" },
      }),
    );

    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/facilities error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!(await isOrgSubscribed(session.orgId))) return NextResponse.json({ error: "Subscription required" }, { status: 402, headers: { "Cache-Control": "no-store" } });
    if (!roleSatisfies(session.orgRole, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const body = await request.json();
    const parsed = createSchema.parse(body);

    const data = await withOrg(session.orgId, async (tx) =>
      tx.facility.create({
        data: {
          orgId: session.orgId,
          ...parsed,
        },
      }),
    );

    return NextResponse.json(
      { data },
      { status: 201, headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("POST /api/facilities error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
