import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    const template = await prisma.workflowTemplate.findFirst({
      where: { id, orgId: session.orgId },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

    const exportData = {
      name: template.name,
      description: template.description,
      steps: template.steps.map((s) => ({
        order: s.order,
        name: s.name,
        description: s.description,
      })),
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    return NextResponse.json(exportData, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
