import { zodErrorMessage } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prismaAdmin } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    // Throttle guessing the current password from a hijacked session. This
    // runs BEFORE CSRF validation: validateCsrfToken rotates the session
    // token, and a 429 issued after rotation would strand the client with a
    // stale token (every retry would then 403 until a page reload).
    const rateLimit = checkRateLimit(`change-password:${session.userId}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter), "Cache-Control": "no-store" } }
      );
    }

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const user = await prismaAdmin.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400, headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } }
      );
    }
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from the current one" },
        { status: 400, headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prismaAdmin.user.update({ where: { id: user.id }, data: { password: hashed } });

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    console.error("POST /api/auth/change-password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
