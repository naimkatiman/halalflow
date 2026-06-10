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
    const user = await prismaAdmin.user.create({ data: { name, email: normalizedEmail, password: hashed } });

    let orgId = "";
    let orgRole = "";

    if (inviteToken) {
      // Auto-accept pending invitation if token matches
      const invite = await prismaAdmin.invitation.findUnique({ where: { token: inviteToken } });
      if (
        invite &&
        !invite.acceptedAt &&
        invite.expiresAt > new Date() &&
        invite.email.toLowerCase() === normalizedEmail
      ) {
        await prismaAdmin.$transaction([
          prismaAdmin.orgMember.create({
            data: { orgId: invite.orgId, userId: user.id, role: invite.role },
          }),
          prismaAdmin.invitation.update({
            where: { id: invite.id },
            data: { acceptedAt: new Date() },
          }),
        ]);
        orgId = invite.orgId;
        orgRole = invite.role;
      }
    } else if (orgName) {
      // Provision a brand-new org + owner membership + default templates in one
      // transaction (admin client: no org context exists yet to satisfy RLS).
      let slug = slugify(orgName) || "workspace";
      const clash = await prismaAdmin.organization.findUnique({ where: { slug } });
      if (clash) slug = `${slug}-${Date.now().toString(36)}`;

      const org = await prismaAdmin.$transaction(async (tx) => {
        const created = await tx.organization.create({
          data: { name: orgName, slug, members: { create: { userId: user.id, role: "owner" } } },
        });
        for (const t of defaultTemplates) {
          await tx.workflowTemplate.create({
            data: {
              orgId: created.id,
              name: t.name,
              description: t.description,
              steps: { create: t.steps.map((s) => ({ orgId: created.id, name: s.name, description: s.description, order: s.order })) },
            },
          });
        }
        return created;
      });
      orgId = org.id;
      orgRole = "owner";

      // Create the Stripe customer AFTER the org is committed. Non-fatal: if
      // Stripe is unconfigured or the call fails, the org still works (trialing).
      const stripe = getStripe();
      if (stripe) {
        try {
          const customer = await stripe.customers.create({
            email: normalizedEmail,
            name: orgName,
            metadata: { orgId },
          });
          await prismaAdmin.organization.update({ where: { id: orgId }, data: { stripeCustomerId: customer.id } });
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
