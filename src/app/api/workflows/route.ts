import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { z } from "zod";

const createSchema = z.object({
  templateId: z.string().min(1),
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
});

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE))));

    const { workflows, total } = await withOrg(session.orgId, async (tx) => {
      const [workflows, total] = await Promise.all([
        tx.workflow.findMany({
          where: { orgId: session.orgId, ...(status ? { status } : {}) },
          include: {
            template: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true, email: true } },
            approvals: {
              include: {
                step: { select: { order: true, name: true } },
                approver: { select: { id: true, name: true } },
              },
              orderBy: { createdAt: "asc" },
            },
            _count: { select: { comments: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        tx.workflow.count({
          where: { orgId: session.orgId, ...(status ? { status } : {}) },
        }),
      ]);
      return { workflows, total };
    });

    return NextResponse.json(
      { workflows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET /api/workflows error:", error);
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
    const { templateId, title, description } = createSchema.parse(body);

    const result = await withOrg(session.orgId, async (tx) => {
      const template = await tx.workflowTemplate.findFirst({
        where: { id: templateId, orgId: session.orgId },
        include: { steps: { orderBy: { order: "asc" } } },
      });
      if (!template) return { error: "Template not found", status: 404 } as const;
      if (template.steps.length === 0) return { error: "Template has no steps", status: 400 } as const;

      const workflow = await tx.workflow.create({
        data: {
          orgId: session.orgId,
          templateId,
          title,
          description,
          status: "in_progress",
          currentStep: 0,
          createdById: session.userId,
          approvals: {
            create: template.steps.map((step) => ({ orgId: session.orgId, stepId: step.id, status: "pending" })),
          },
          auditLogs: {
            create: {
              orgId: session.orgId,
              userId: session.userId,
              action: "created",
              detail: `Workflow created from template "${template.name}"`,
            },
          },
        },
        include: {
          template: { select: { id: true, name: true } },
          approvals: { include: { step: true }, orderBy: { createdAt: "asc" } },
        },
      });
      return { workflow } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(
      { workflow: result.workflow },
      { status: 201, headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("POST /api/workflows error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
