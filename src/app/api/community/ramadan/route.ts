import { zodErrorMessage } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { isOrgSubscribed } from "@/lib/require-subscription";
import { roleSatisfies } from "@/lib/roles";
import { RAMADAN_TYPES } from "@/lib/community";
import { z } from "zod";

const programSchema = z.object({
  type: z.enum(RAMADAN_TYPES),
  title: z.string().trim().max(160).optional(),
  description: z.string().trim().min(1).max(1000),
  time: z.string().trim().max(60).optional(),
  schedule: z.string().trim().max(120).optional(),
  isFree: z.boolean().default(true),
  sponsorName: z.string().trim().max(160).optional(),
});

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!(await isOrgSubscribed(session.orgId))) return NextResponse.json({ error: "Subscription required" }, { status: 402, headers: { "Cache-Control": "no-store" } });

    const data = await withOrg(session.orgId, async (tx) =>
      tx.ramadanProgram.findMany({
        where: { orgId: session.orgId },
        orderBy: [{ type: "asc" }, { createdAt: "asc" }],
      }),
    );

    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/community/ramadan error:", error);
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
    const parsed = programSchema.parse(body);

    const data = await withOrg(session.orgId, async (tx) =>
      tx.ramadanProgram.create({
        data: { ...parsed, orgId: session.orgId },
      }),
    );

    return NextResponse.json(
      { data },
      { status: 201, headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("POST /api/community/ramadan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
