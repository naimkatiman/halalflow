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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!(await isOrgSubscribed(session.orgId))) return NextResponse.json({ error: "Subscription required" }, { status: 402, headers: { "Cache-Control": "no-store" } });
    if (!roleSatisfies(session.orgRole, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    const body = await request.json();
    const parsed = createSchema.partial().parse(body);

    const result = await withOrg(session.orgId, async (tx) => {
      const existing = await tx.facility.findFirst({ where: { id, orgId: session.orgId } });
      if (!existing) return { error: "Facility not found", status: 404 } as const;

      const data = await tx.facility.update({ where: { id }, data: parsed });
      return { data } as const;
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });

    return NextResponse.json(
      { data: result.data },
      { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("PATCH /api/facilities/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!(await isOrgSubscribed(session.orgId))) return NextResponse.json({ error: "Subscription required" }, { status: 402, headers: { "Cache-Control": "no-store" } });
    if (!roleSatisfies(session.orgRole, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(_req);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    const result = await withOrg(session.orgId, async (tx) => {
      const existing = await tx.facility.findFirst({ where: { id, orgId: session.orgId } });
      if (!existing) return { error: "Facility not found", status: 404 } as const;

      await tx.facility.delete({ where: { id } });
      return { ok: true } as const;
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } });
  } catch (error) {
    console.error("DELETE /api/facilities/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
