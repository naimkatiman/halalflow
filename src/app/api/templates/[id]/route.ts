import { zodErrorMessage } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(2000).trim().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    const template = await withOrg(session.orgId, async (tx) =>
      tx.workflowTemplate.findFirst({
        where: { id, orgId: session.orgId },
        include: { steps: { orderBy: { order: "asc" } }, _count: { select: { workflows: true } } },
      }),
    );
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

    return NextResponse.json({ template }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/templates/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!["owner", "admin"].includes(session.orgRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    const result = await withOrg(session.orgId, async (tx) => {
      const existing = await tx.workflowTemplate.findFirst({ where: { id, orgId: session.orgId } });
      if (!existing) return { error: "Not found", status: 404 } as const;

      const body = await request.json();
      const data = updateSchema.parse(body);
      const template = await tx.workflowTemplate.update({ where: { id }, data });
      return { template } as const;
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });

    return NextResponse.json({ template: result.template }, { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("PUT /api/templates/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!["owner", "admin"].includes(session.orgRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(_req);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    const result = await withOrg(session.orgId, async (tx) => {
      const existing = await tx.workflowTemplate.findFirst({ where: { id, orgId: session.orgId } });
      if (!existing) return { error: "Not found", status: 404 } as const;

      await tx.workflowTemplate.delete({ where: { id } });
      return { ok: true } as const;
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } });
  } catch (error) {
    console.error("DELETE /api/templates/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
