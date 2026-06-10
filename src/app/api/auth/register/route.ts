import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prismaAdmin } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { defaultTemplates } from "@/lib/default-templates";
import { SessionData, sessionOptions } from "@/lib/session";
import { generateCsrfToken } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email(),
  password: z.string().min(8),
  inviteToken: z.string().optional(),
  orgName: z.string().min(1).max(100).trim().optional(),
});

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rateLimitKey = `register:${ip}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter), 'Cache-Control': 'no-store' } }
      );
    }

    const body = await request.json();
    const { name, email, password, inviteToken, orgName } = registerSchema.parse(body);
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prismaAdmin.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409, headers: { "Cache-Control": "no-store" } });

    const hashed = await bcrypt.hash(password, 12);

    // Create the user together with any invite acceptance / org provisioning in
    // ONE transaction: a failure (slug collision, template insert, …) rolls the
    // user back too, so we never leave an orphaned, permanently-locked account.
    let result: {
      user: { id: string; email: string; name: string; role: string };
      orgId: string;
      orgRole: string;
      newOrgId: string | null;
    };
    try {
      result = await prismaAdmin.$transaction(async (tx) => {
        const user = await tx.user.create({ data: { name, email: normalizedEmail, password: hashed } });
        let orgId = "";
        let orgRole = "";
        let newOrgId: string | null = null;

        if (inviteToken) {
          const invite = await tx.invitation.findUnique({ where: { token: inviteToken } });
          if (
            invite &&
            !invite.acceptedAt &&
            invite.expiresAt > new Date() &&
            invite.email.toLowerCase() === normalizedEmail
          ) {
            await tx.orgMember.create({ data: { orgId: invite.orgId, userId: user.id, role: invite.role } });
            await tx.invitation.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
            orgId = invite.orgId;
            orgRole = invite.role;
          }
          // Invalid/expired/mismatched invite → orgId stays empty → onboarding.
        } else if (orgName) {
          let slug = slugify(orgName) || "workspace";
          const clash = await tx.organization.findUnique({ where: { slug } });
          if (clash) slug = `${slug}-${Date.now().toString(36)}`;
          const org = await tx.organization.create({
            data: { name: orgName, slug, members: { create: { userId: user.id, role: "owner" } } },
          });
          for (const t of defaultTemplates) {
            await tx.workflowTemplate.create({
              data: {
                orgId: org.id,
                name: t.name,
                description: t.description,
                steps: { create: t.steps.map((s) => ({ orgId: org.id, name: s.name, description: s.description, order: s.order })) },
              },
            });
          }
          orgId = org.id;
          orgRole = "owner";
          newOrgId = org.id;
        }

        return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, orgId, orgRole, newOrgId };
      });
    } catch (err) {
      // Unique violation (race on email or org slug). Nothing was committed —
      // the whole transaction rolled back — so the request is safe to retry.
      if (typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2002") {
        return NextResponse.json(
          { error: "That email or workspace name is already taken. Please try again." },
          { status: 409, headers: { "Cache-Control": "no-store" } }
        );
      }
      throw err;
    }

    const { user, orgId, orgRole, newOrgId } = result;

    // Create the Stripe customer AFTER commit. Non-fatal: if Stripe is
    // unconfigured or the call fails, the org still works (trialing).
    if (newOrgId) {
      const stripe = getStripe();
      if (stripe) {
        try {
          const customer = await stripe.customers.create({ email: normalizedEmail, name: orgName, metadata: { orgId: newOrgId } });
          await prismaAdmin.organization.update({ where: { id: newOrgId }, data: { stripeCustomerId: customer.id } });
        } catch (err) {
          console.error("Stripe customer creation failed (non-fatal):", err);
        }
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
    session.csrfToken = generateCsrfToken();
    await session.save();

    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name }, orgId },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
