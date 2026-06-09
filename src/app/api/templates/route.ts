import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { z } from "zod";

const stepSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(2000).trim().optional(),
  order: z.number().int().min(0),
  requiredRole: z.enum(["owner", "admin", "member"]).optional(),
});

const createSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(2000).trim().optional(),
  steps: z.array(stepSchema).min(1),
});

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE))));

    const [templates, total] = await Promise.all([
      prisma.workflowTemplate.findMany({
        where: { orgId: session.orgId },
        include: { steps: { orderBy: { order: "asc" } }, _count: { select: { workflows: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workflowTemplate.count({
        where: { orgId: session.orgId },
      }),
    ]);

    return NextResponse.json(
      { templates, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET /api/templates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const body = await request.json();
    const { name, description, steps } = createSchema.parse(body);

    const template = await prisma.workflowTemplate.create({
      data: {
        orgId: session.orgId,
        name,
        description,
        steps: { create: steps.map((s) => ({ orgId: session.orgId, name: s.name, description: s.description, order: s.order, requiredRole: s.requiredRole })) },
      },
      include: { steps: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(
      { template },
      { status: 201, headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("POST /api/templates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
