import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { z } from "zod";

const stepsSchema = z.array(
  z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    order: z.number().int().min(0),
  })
).min(1);

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
    const steps = stepsSchema.parse(body);

    await prisma.$transaction([
      prisma.templateStep.deleteMany({ where: { templateId: id } }),
      prisma.templateStep.createMany({
        data: steps.map((s) => ({ templateId: id, name: s.name, description: s.description, order: s.order })),
      }),
    ]);

    const updated = await prisma.templateStep.findMany({ where: { templateId: id }, orderBy: { order: "asc" } });
    return NextResponse.json({ steps: updated }, { headers: { "X-CSRF-Token": csrf.newToken } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
