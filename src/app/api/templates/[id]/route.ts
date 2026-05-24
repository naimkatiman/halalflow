import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const template = await prisma.workflowTemplate.findFirst({
      where: { id, orgId: session.orgId },
      include: { steps: { orderBy: { order: "asc" } }, _count: { select: { workflows: true } } },
    });
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ template });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["owner", "admin"].includes(session.orgRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.workflowTemplate.findFirst({ where: { id, orgId: session.orgId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const data = updateSchema.parse(body);
    const template = await prisma.workflowTemplate.update({ where: { id }, data });

    return NextResponse.json({ template }, { headers: { "X-CSRF-Token": csrf.newToken } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["owner", "admin"].includes(session.orgRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const csrf = await validateCsrfToken(_req);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.workflowTemplate.findFirst({ where: { id, orgId: session.orgId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.workflowTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { headers: { "X-CSRF-Token": csrf.newToken } });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
