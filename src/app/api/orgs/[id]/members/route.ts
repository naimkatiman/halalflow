import { zodErrorMessage } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { z } from "zod";
import { generateInviteToken, getInviteExpiryDate } from "@/lib/invite-token";
import { sendInviteEmail } from "@/lib/notifications/invite-email";

const inviteSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    const result = await withOrg(id, async (tx) => {
      const callerMember = await tx.orgMember.findUnique({
        where: { orgId_userId: { orgId: id, userId: session.userId } },
      });
      if (!callerMember || !["owner", "admin"].includes(callerMember.role)) {
        return { forbidden: true } as const;
      }

      const [members, pendingInvites] = await Promise.all([
        tx.orgMember.findMany({
          where: { orgId: id },
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        }),
        tx.invitation.findMany({
          where: { orgId: id, acceptedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        }),
      ]);
      return { members, pendingInvites } as const;
    });

    if ("forbidden" in result) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    return NextResponse.json({ members: result.members, pendingInvites: result.pendingInvites }, { headers: { "Cache-Control": "no-store" } });
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
    const body = await request.json();
    const { email, role } = inviteSchema.parse(body);
    const normalizedEmail = email.toLowerCase().trim();

    // All DB work happens inside the org's RLS context; the network email send
    // is deliberately kept outside the transaction so it can't hold the
    // pinned connection open or trip the transaction timeout.
    const result = await withOrg(id, async (tx) => {
      const callerMember = await tx.orgMember.findUnique({
        where: { orgId_userId: { orgId: id, userId: session.userId } },
      });
      if (!callerMember || !["owner", "admin"].includes(callerMember.role)) {
        return { status: 403, error: "Forbidden" } as const;
      }

      const org = await tx.organization.findUnique({ where: { id } });
      if (!org) return { status: 404, error: "Organization not found" } as const;

      const caller = await tx.user.findUnique({ where: { id: session.userId } });

      // Case 1: User already exists — add directly if not already a member
      const existingUser = await tx.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        const existingMember = await tx.orgMember.findUnique({
          where: { orgId_userId: { orgId: id, userId: existingUser.id } },
        });
        if (existingMember) return { status: 409, error: "Already a member" } as const;

        const member = await tx.orgMember.create({
          data: { orgId: id, userId: existingUser.id, role },
          include: { user: { select: { id: true, name: true, email: true } } },
        });
        return { kind: "direct", member } as const;
      }

      // Case 2: User does not exist — create an invitation
      const existingInvite = await tx.invitation.findFirst({
        where: { orgId: id, email: normalizedEmail, acceptedAt: null, expiresAt: { gt: new Date() } },
      });
      if (existingInvite) return { status: 409, error: "Invitation already pending" } as const;

      const token = generateInviteToken();
      const invite = await tx.invitation.create({
        data: { orgId: id, email: normalizedEmail, role, token, expiresAt: getInviteExpiryDate() },
      });
      return {
        kind: "invitation",
        invite,
        orgName: org.name,
        callerName: caller ? caller.name || caller.email : null,
        token,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });
    }

    if (result.kind === "direct") {
      return NextResponse.json({ member: result.member, type: "direct" }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/invites/${result.token}`;
    let emailSent = false;
    if (result.callerName) {
      const delivery = await sendInviteEmail(normalizedEmail, result.orgName, inviteUrl, result.callerName);
      emailSent = delivery.ok;
    }

    // inviteUrl goes back to the inviter so they can share it directly
    // (WhatsApp etc.) — essential when email delivery is not configured.
    return NextResponse.json(
      { invite: result.invite, type: "invitation", inviteUrl, emailSent },
      { status: 201, headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("POST /api/orgs/[id]/members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
