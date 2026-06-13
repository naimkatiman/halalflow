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
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Defaults-free on purpose: a partial PATCH body must never reset
// isFree or other boolean fields to their create-time defaults.
const updateSchema = z.object({
  type: z.enum(RAMADAN_TYPES).optional(),
  title: z.string().trim().max(160).optional(),
  description: z.string().trim().min(1).max(1000).optional(),
  time: z.string().trim().max(60).optional(),
  schedule: z.string().trim().max(120).optional(),
  isFree: z.boolean().optional(),
  sponsorName: z.string().trim().max(160).optional(),
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
    const parsed = updateSchema.parse(body);

    const result = await withOrg(session.orgId, async (tx) => {
      const existing = await tx.ramadanProgram.findFirst({ where: { id, orgId: session.orgId } });
      if (!existing) return { error: "Program not found", status: 404 } as const;

      const data = await tx.ramadanProgram.update({ where: { id }, data: parsed });
      return { data } as const;
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });

    return NextResponse.json(
      { data: result.data },
      { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "Program not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    console.error("PATCH /api/community/ramadan/[id] error:", error);
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
      const existing = await tx.ramadanProgram.findFirst({ where: { id, orgId: session.orgId } });
      if (!existing) return { error: "Program not found", status: 404 } as const;

      await tx.ramadanProgram.delete({ where: { id } });
      return { ok: true } as const;
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "Program not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    console.error("DELETE /api/community/ramadan/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
