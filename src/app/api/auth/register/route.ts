import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  inviteToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rateLimitKey = `register:${ip}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const body = await request.json();
    const { name, email, password, inviteToken } = registerSchema.parse(body);
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email: normalizedEmail, password: hashed } });

    let orgId = "";
    let orgRole = "";

    // Auto-accept pending invitation if token matches
    if (inviteToken) {
      const invite = await prisma.invitation.findUnique({
        where: { token: inviteToken },
      });
      if (
        invite &&
        !invite.acceptedAt &&
        invite.expiresAt > new Date() &&
        invite.email.toLowerCase() === normalizedEmail
      ) {
        await prisma.$transaction([
          prisma.orgMember.create({
            data: { orgId: invite.orgId, userId: user.id, role: invite.role },
          }),
          prisma.invitation.update({
            where: { id: invite.id },
            data: { acceptedAt: new Date() },
          }),
        ]);
        orgId = invite.orgId;
        orgRole = invite.role;
      }
    }

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.userId = user.id;
    session.email = user.email;
    session.name = user.name;
    session.role = user.role;
    session.orgId = orgId;
    session.orgRole = orgRole;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name }, orgId },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
