import { zodErrorMessage } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { isOrgSubscribed } from "@/lib/require-subscription";
import { z } from "zod";

const stepsSchema = z.array(
  z.object({
    name: z.string().min(1).max(100).trim(),
    description: z.string().max(2000).trim().optional(),
    order: z.number().int().min(0),
    requiredRole: z.enum(["owner", "admin", "member"]).optional(),
  })
).min(1);

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!["owner", "admin"].includes(session.orgRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });
    if (!(await isOrgSubscribed(session.orgId))) return NextResponse.json({ error: "Subscription required" }, { status: 402, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    const existing = await withOrg(session.orgId, async (tx) => {
      return tx.workflowTemplate.findFirst({ where: { id, orgId: session.orgId } });
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

    const body = await request.json();
    const steps = stepsSchema.parse(body);

    const updated = await withOrg(session.orgId, async (tx) => {
      await tx.templateStep.deleteMany({ where: { templateId: id } });
      await tx.templateStep.createMany({
        data: steps.map((s) => ({ orgId: session.orgId, templateId: id, name: s.name, description: s.description, order: s.order, requiredRole: s.requiredRole })),
      });
      return tx.templateStep.findMany({ where: { templateId: id }, orderBy: { order: "asc" } });
    });
    return NextResponse.json({ steps: updated }, { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("PUT /api/templates/[id]/steps error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
