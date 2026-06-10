import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    // Run under the requested org's RLS context: the membership lookup returns
    // the caller's row only if they belong to org `id`, gating all that follows.
    const result = await withOrg(id, async (tx) => {
      const member = await tx.orgMember.findUnique({
        where: { orgId_userId: { orgId: id, userId: session.userId } },
      });
      if (!member) return { notFound: true } as const;

      const org = await tx.organization.findUnique({
        where: { id },
        include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
      });
      return { org } as const;
    });

    if ("notFound" in result) return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

    return NextResponse.json({ org: result.org }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/orgs/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
