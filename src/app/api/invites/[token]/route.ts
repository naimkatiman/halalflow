import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invite = await prisma.invitation.findUnique({
      where: { token },
      include: { org: { select: { name: true } } },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 410 });
    }

    return NextResponse.json({
      invite: {
        email: invite.email,
        role: invite.role,
        orgName: invite.org.name,
        expiresAt: invite.expiresAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });

    const { token } = await params;
    const invite = await prisma.invitation.findUnique({
      where: { token },
      include: { org: true },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 410 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation is for a different email address" },
        { status: 403 }
      );
    }

    const existingMember = await prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId: invite.orgId, userId: user.id } },
    });
    if (existingMember) {
      return NextResponse.json({ error: "Already a member" }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.orgMember.create({
        data: { orgId: invite.orgId, userId: user.id, role: invite.role },
      }),
      prisma.invitation.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    // Update session org context
    session.orgId = invite.orgId;
    session.orgRole = invite.role;
    await session.save();

    return NextResponse.json({ ok: true }, { headers: { "X-CSRF-Token": csrf.newToken } });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
