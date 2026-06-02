import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { buildWorkflowDecisionEmail, sendEmail } from "@/lib/notifications/email";
import { z } from "zod";

const approveSchema = z.object({
  action: z.enum(["approved", "rejected"]),
  note: z.string().optional(),
});

type WorkflowForNotification = {
  title: string;
  org: {
    name: string;
    members: Array<{ role: string; user: { email: string } }>;
  };
  createdBy: { name: string; email: string };
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function collectRecipients(workflow: WorkflowForNotification, actorEmail: string) {
  const recipients = new Set<string>();
  recipients.add(normalizeEmail(workflow.createdBy.email));

  for (const member of workflow.org.members) {
    if (["owner", "admin"].includes(member.role)) {
      recipients.add(normalizeEmail(member.user.email));
    }
  }

  recipients.delete(normalizeEmail(actorEmail));
  return Array.from(recipients);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    const workflow = await prisma.workflow.findFirst({
      where: { id, orgId: session.orgId },
      include: {
        org: {
          include: {
            members: { include: { user: { select: { email: true } } } },
          },
        },
        createdBy: { select: { name: true, email: true } },
        template: { include: { steps: { orderBy: { order: "asc" } } } },
        approvals: { include: { step: true }, orderBy: { createdAt: "asc" } },
      },
    });

    if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    if (!["in_progress", "pending"].includes(workflow.status)) {
      return NextResponse.json({ error: "Workflow is not active" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    if (workflow.createdById === session.userId) {
      return NextResponse.json({ error: "You cannot approve your own workflow" }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }

    const body = await request.json();
    const { action, note } = approveSchema.parse(body);

    const pendingApproval = workflow.approvals.find(
      (approval) => approval.status === "pending" && approval.step.order === workflow.currentStep
    );
    if (!pendingApproval) {
      return NextResponse.json({ error: "No pending step at current position" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

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

    const recipientEmails = collectRecipients(workflow, session.email);
    const emailEnvelope = buildWorkflowDecisionEmail({
      workflowTitle: workflow.title,
      workflowStatus: action,
      stepName: pendingApproval.step.name,
      actorName: session.name || workflow.createdBy.name || session.email,
      note,
      recipients: recipientEmails,
      orgName: workflow.org.name,
      workflowId: id,
    });

    const deliveries = await Promise.allSettled(
      recipientEmails.map((to) =>
        sendEmail({
          to,
          subject: emailEnvelope.subject,
          text: emailEnvelope.text,
          html: emailEnvelope.html,
        })
      )
    );

    const notifications = deliveries.map((result, index) => {
      const recipient = recipientEmails[index];
      if (result.status === "fulfilled") {
        return { recipient, ...result.value };
      }
      return {
        recipient,
        ok: false,
        reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
      };
    });

    return NextResponse.json(
      { workflow: updated, notifications },
      { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("POST /api/workflows/[id]/approve error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
