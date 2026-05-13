import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { z } from "zod";

const approveSchema = z.object({
  action: z.enum(["approved", "rejected"]),
  note: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const workflow = await prisma.workflow.findFirst({
      where: { id, orgId: session.orgId },
      include: {
        template: { include: { steps: { orderBy: { order: "asc" } } } },
        approvals: { include: { step: true }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!["in_progress", "pending"].includes(workflow.status)) {
      return NextResponse.json({ error: "Workflow is not active" }, { status: 400 });
    }

    const body = await request.json();
    const { action, note } = approveSchema.parse(body);

    const pendingApproval = workflow.approvals.find(
      (a) => a.status === "pending" && a.step.order === workflow.currentStep
    );
    if (!pendingApproval) return NextResponse.json({ error: "No pending step at current position" }, { status: 400 });

    const totalSteps = workflow.template.steps.length;
    const nextStep = workflow.currentStep + 1;
    const isLastStep = nextStep >= totalSteps;
    const newWorkflowStatus = action === "rejected" ? "rejected" : isLastStep ? "approved" : "in_progress";

    await prisma.$transaction([
      prisma.approval.update({
        where: { id: pendingApproval.id },
        data: { status: action, approverId: session.userId, note },
      }),
      prisma.workflow.update({
        where: { id },
        data: {
          currentStep: action === "approved" ? nextStep : workflow.currentStep,
          status: newWorkflowStatus,
        },
      }),
      prisma.auditLog.create({
        data: {
          workflowId: id,
          userId: session.userId,
          action,
          detail: `Step "${pendingApproval.step.name}" ${action}${note ? `: ${note}` : ""}`,
        },
      }),
    ]);

    const updated = await prisma.workflow.findUnique({
      where: { id },
      include: { approvals: { include: { step: true }, orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json({ workflow: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
