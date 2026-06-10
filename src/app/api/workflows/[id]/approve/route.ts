import { zodErrorMessage } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { roleSatisfies } from "@/lib/roles";
import { isOrgSubscribed } from "@/lib/require-subscription";
import { buildWorkflowDecisionEmail, sendEmail } from "@/lib/notifications/email";
import { z } from "zod";

const approveSchema = z.object({
  action: z.enum(["approved", "rejected"]),
  note: z.string().max(1000).trim().optional(),
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
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });
    if (!(await isOrgSubscribed(session.orgId))) return NextResponse.json({ error: "Subscription required" }, { status: 402, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;

    // All reads + writes run in one org-scoped transaction. The email fan-out
    // is intentionally kept outside it (network I/O must not hold the tx open).
    const result = await withOrg(session.orgId, async (tx) => {
      const workflow = await tx.workflow.findFirst({
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

      if (!workflow) return { status: 404, error: "Not found" } as const;
      if (!["in_progress", "pending"].includes(workflow.status)) {
        return { status: 400, error: "Workflow is not active" } as const;
      }
      if (workflow.createdById === session.userId) {
        return { status: 403, error: "You cannot approve your own workflow" } as const;
      }

      const body = await request.json();
      const { action, note } = approveSchema.parse(body);

      const pendingApproval = workflow.approvals.find(
        (approval) => approval.status === "pending" && approval.step.order === workflow.currentStep
      );
      if (!pendingApproval) {
        return { status: 400, error: "No pending step at current position" } as const;
      }
      if (pendingApproval.step.requiredRole && !roleSatisfies(session.orgRole, pendingApproval.step.requiredRole)) {
        return { status: 403, error: "You do not have the required role for this step" } as const;
      }

      const totalSteps = workflow.template.steps.length;
      const nextStep = workflow.currentStep + 1;
      const isLastStep = nextStep >= totalSteps;
      const newWorkflowStatus = action === "rejected" ? "rejected" : isLastStep ? "approved" : "in_progress";

      // Already inside an interactive transaction — run the three writes
      // sequentially on `tx` (cannot nest a tx.$transaction array here).
      await tx.approval.update({
        where: { id: pendingApproval.id },
        data: { status: action, approverId: session.userId, note },
      });
      await tx.workflow.update({
        where: { id },
        data: {
          currentStep: action === "approved" ? nextStep : workflow.currentStep,
          status: newWorkflowStatus,
        },
      });
      await tx.auditLog.create({
        data: {
          orgId: workflow.orgId,
          workflowId: id,
          userId: session.userId,
          action,
          detail: `Step "${pendingApproval.step.name}" ${action}${note ? `: ${note}` : ""}`,
        },
      });

      const updated = await tx.workflow.findUnique({
        where: { id },
        include: { approvals: { include: { step: true }, orderBy: { createdAt: "asc" } } },
      });

      return { workflow, action, note, stepName: pendingApproval.step.name, updated } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });
    }

    const { workflow, action, note, stepName, updated } = result;

    const recipientEmails = collectRecipients(workflow, session.email);
    const emailEnvelope = buildWorkflowDecisionEmail({
      workflowTitle: workflow.title,
      workflowStatus: action,
      stepName,
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

    const notifications = deliveries.map((delivery, index) => {
      const recipient = recipientEmails[index];
      if (delivery.status === "fulfilled") {
        return { recipient, ...delivery.value };
      }
      return {
        recipient,
        ok: false,
        reason: delivery.reason instanceof Error ? delivery.reason.message : String(delivery.reason),
      };
    });

    return NextResponse.json(
      { workflow: updated, notifications },
      { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("POST /api/workflows/[id]/approve error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
