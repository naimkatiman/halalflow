import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const workflow = await prisma.workflow.findFirst({
      where: { id, orgId: session.orgId },
      include: {
        template: { include: { steps: { orderBy: { order: "asc" } } } },
        createdBy: { select: { id: true, name: true, email: true } },
        approvals: {
          include: {
            step: true,
            approver: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        comments: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "asc" },
        },
        auditLogs: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ workflow });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const workflow = await prisma.workflow.findFirst({ where: { id, orgId: session.orgId } });
    if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (workflow.createdById !== session.userId && !["owner", "admin"].includes(session.orgRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.workflow.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
