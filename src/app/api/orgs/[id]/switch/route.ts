import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(_req);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    // Membership lookup runs under the requested org's RLS context, so it
    // returns the caller's row only if they are genuinely a member → the
    // query itself is the authorization gate.
    const member = await withOrg(id, (tx) =>
      tx.orgMember.findUnique({
        where: { orgId_userId: { orgId: id, userId: session.userId } },
      })
    );
    if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    session.orgId = id;
    session.orgRole = member.role;
    await session.save();

    return NextResponse.json(
      { orgId: id, orgRole: member.role },
      { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } }
    );
  } catch (error) {
    console.error("Org switch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
