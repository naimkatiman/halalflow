import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { z } from "zod";

const commentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;

    const body = await request.json();
    const { body: commentBody } = commentSchema.parse(body);

    const result = await withOrg(session.orgId, async (tx) => {
      const workflow = await tx.workflow.findFirst({ where: { id, orgId: session.orgId } });
      if (!workflow) return { error: "Not found", status: 404 } as const;

      const comment = await tx.comment.create({
        data: { orgId: workflow.orgId, workflowId: id, userId: session.userId, body: commentBody },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      return { comment } as const;
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });

    return NextResponse.json(
      { comment: result.comment },
      { status: 201, headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } }
    );
  } catch (error) {
    console.error("POST /api/workflows/[id]/comments error:", error);
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
