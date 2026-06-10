import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    const result = await withOrg(session.orgId, async (tx) => {
      const template = await tx.workflowTemplate.findFirst({
        where: { id, orgId: session.orgId },
        include: { steps: { orderBy: { order: "asc" } } },
      });
      if (!template) return { error: "Not found", status: 404 } as const;
      return { template } as const;
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });

    const template = result.template;
    const exportData = {
      name: template.name,
      description: template.description,
      steps: template.steps.map((s) => ({
        order: s.order,
        name: s.name,
        description: s.description,
        requiredRole: s.requiredRole,
      })),
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    return NextResponse.json(exportData, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Template export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
