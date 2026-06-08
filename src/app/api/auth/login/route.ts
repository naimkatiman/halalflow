import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { generateCsrfToken } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP + email combination
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);
    const normalizedEmail = email.toLowerCase().trim();
    const rateLimitKey = `login:${ip}:${normalizedEmail}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter), 'Cache-Control': 'no-store' } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: { include: { org: true }, orderBy: { createdAt: "asc" }, take: 1 },
      },
    });
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const membership = user.memberships[0];

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.userId = user.id;
    session.email = user.email;
    session.name = user.name;
    session.role = user.role;
    session.orgId = membership?.orgId ?? "";
    session.orgRole = membership?.role ?? "";
    session.isLoggedIn = true;
    session.csrfToken = generateCsrfToken();
    await session.save();

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      org: membership ? { id: membership.orgId, name: membership.org.name, role: membership.role } : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
