import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { z } from "zod";
import { generateInviteToken, getInviteExpiryDate } from "@/lib/invite-token";
import { sendInviteEmail } from "@/lib/notifications/invite-email";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    const callerMember = await prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId: id, userId: session.userId } },
    });
    if (!callerMember || !["owner", "admin"].includes(callerMember.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }

    const [members, pendingInvites] = await Promise.all([
      prisma.orgMember.findMany({
        where: { orgId: id },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invitation.findMany({
        where: { orgId: id, acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ members, pendingInvites }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/orgs/[id]/members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    const callerMember = await prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId: id, userId: session.userId } },
    });
    if (!callerMember || !["owner", "admin"].includes(callerMember.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }

    const body = await request.json();
    const { email, role } = inviteSchema.parse(body);
    const normalizedEmail = email.toLowerCase().trim();

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

    const caller = await prisma.user.findUnique({ where: { id: session.userId } });

    // Case 1: User already exists — add directly if not already a member
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      const existingMember = await prisma.orgMember.findUnique({
        where: { orgId_userId: { orgId: id, userId: existingUser.id } },
      });
      if (existingMember) return NextResponse.json({ error: "Already a member" }, { status: 409, headers: { "Cache-Control": "no-store" } });

      const member = await prisma.orgMember.create({
        data: { orgId: id, userId: existingUser.id, role },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      return NextResponse.json({ member, type: "direct" }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }

    // Case 2: User does not exist — create an invitation
    const existingInvite = await prisma.invitation.findFirst({
      where: { orgId: id, email: normalizedEmail, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingInvite) {
      return NextResponse.json({ error: "Invitation already pending" }, { status: 409, headers: { "Cache-Control": "no-store" } });
    }

    const token = generateInviteToken();
    const invite = await prisma.invitation.create({
      data: {
        orgId: id,
        email: normalizedEmail,
        role,
        token,
        expiresAt: getInviteExpiryDate(),
      },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/invites/${token}`;
    if (caller) {
      await sendInviteEmail(normalizedEmail, org.name, inviteUrl, caller.name || caller.email);
    }

    return NextResponse.json(
      { invite, type: "invitation" },
      { status: 201, headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("POST /api/orgs/[id]/members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
