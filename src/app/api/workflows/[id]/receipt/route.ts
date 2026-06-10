import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .substring(0, 40);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const { id } = await params;
    const result = await withOrg(session.orgId, async (tx) => {
      const workflow = await tx.workflow.findFirst({
        where: { id, orgId: session.orgId },
        include: {
          template: true,
          org: true,
          createdBy: { select: { name: true } },
          approvals: {
            include: {
              step: true,
              approver: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!workflow) {
        return { error: "Not found", status: 404 } as const;
      }

      if (workflow.status !== "approved") {
        return { error: "Workflow not approved", status: 403 } as const;
      }

      return { workflow } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });
    }

    const { workflow } = result;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter
    const { height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    let y = height - margin;

    // Header
    page.drawText("HalalFlow", {
      x: margin,
      y,
      size: 24,
      font: boldFont,
      color: rgb(0.05, 0.25, 0.15),
    });
    y -= 32;

    page.drawText("Workflow Receipt", {
      x: margin,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 28;

    // Org name
    page.drawText(workflow.org.name, {
      x: margin,
      y,
      size: 12,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 40;

    // Workflow title
    page.drawText("Workflow:", {
      x: margin,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 16;

    page.drawText(workflow.title, {
      x: margin,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 22;

    if (workflow.description) {
      page.drawText(workflow.description, {
        x: margin,
        y,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 16;
    }

    y -= 20;

    // Template
    page.drawText(`Template: ${workflow.template.name}`, {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 16;

    // Dates
    page.drawText(`Submitted: ${workflow.createdAt.toLocaleDateString()}`, {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 16;

    if (workflow.createdBy?.name) {
      page.drawText(`Created by: ${workflow.createdBy.name}`, {
        x: margin,
        y,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 16;
    }

    const finalApproval = workflow.approvals.find((a) => a.status === "approved" && a.step.order === workflow.approvals.length - 1);
    if (finalApproval?.updatedAt) {
      page.drawText(`Approved: ${finalApproval.updatedAt.toLocaleDateString()}`, {
        x: margin,
        y,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 16;
    }

    y -= 24;

    // Approval chain header
    page.drawText("Approval Chain", {
      x: margin,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 20;

    for (const approval of workflow.approvals) {
      const stepNum = approval.step.order + 1;
      const approverName = approval.approver?.name ?? "Pending";
      const status = approval.status.charAt(0).toUpperCase() + approval.status.slice(1);
      const dateStr = approval.updatedAt ? approval.updatedAt.toLocaleDateString() : "—";

      page.drawText(`${stepNum}. ${approval.step.name}`, {
        x: margin,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 14;

      page.drawText(`   Approver: ${approverName}  ·  Status: ${status}  ·  Date: ${dateStr}`, {
        x: margin,
        y,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 14;

      if (approval.note) {
        page.drawText(`   Note: ${approval.note}`, {
          x: margin,
          y,
          size: 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
        y -= 14;
      }

      y -= 6;
    }

    y -= 20;

    // Footer
    page.drawText(`Receipt ID: ${workflow.id}`, {
      x: margin,
      y,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    y -= 12;

    page.drawText(`Generated by HalalFlow · ${new Date().toLocaleDateString()} · halalflow.app`, {
      x: margin,
      y,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${slugify(workflow.title)}-${workflow.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/workflows/[id]/receipt error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
