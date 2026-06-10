import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prismaAdmin } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invite = await prismaAdmin.invitation.findUnique({
      where: { token },
      include: { org: { select: { name: true } } },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 410, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({
      invite: {
        email: invite.email,
        role: invite.role,
        orgName: invite.org.name,
        expiresAt: invite.expiresAt,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/invites/[token] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const { token } = await params;
    const invite = await prismaAdmin.invitation.findUnique({
      where: { token },
      include: { org: true },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 410, headers: { "Cache-Control": "no-store" } });
    }

    const user = await prismaAdmin.user.findUnique({ where: { id: session.userId } });
    if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation is for a different email address" },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    const existingMember = await prismaAdmin.orgMember.findUnique({
      where: { orgId_userId: { orgId: invite.orgId, userId: user.id } },
    });
    if (existingMember) {
      return NextResponse.json({ error: "Already a member" }, { status: 409, headers: { "Cache-Control": "no-store" } });
    }

    try {
      await prismaAdmin.$transaction([
        prismaAdmin.orgMember.create({
          data: { orgId: invite.orgId, userId: user.id, role: invite.role },
        }),
        prismaAdmin.invitation.update({
          where: { id: invite.id },
          data: { acceptedAt: new Date() },
        }),
      ]);
    } catch (err) {
      // Double-submit race: both requests pass the existingMember check, the
      // second create hits the orgId_userId unique constraint. Same outcome
      // as the pre-check, so same response.
      if (typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2002") {
        return NextResponse.json({ error: "Already a member" }, { status: 409, headers: { "Cache-Control": "no-store" } });
      }
      throw err;
    }

    // Update session org context
    session.orgId = invite.orgId;
    session.orgRole = invite.role;
    await session.save();

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } });
  } catch (error) {
    console.error("POST /api/invites/[token] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
