import { zodErrorMessage } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prismaAdmin } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { defaultTemplates } from "@/lib/default-templates";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { z } from "zod";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const createSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const memberships = await prismaAdmin.orgMember.findMany({
      where: { userId: session.userId },
      include: { org: true },
    });

    return NextResponse.json(
      { orgs: memberships.map((m) => ({ ...m.org, role: m.role })) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("GET /api/orgs error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const body = await request.json();
    const { name } = createSchema.parse(body);

    let slug = slugify(name);
    const existing = await prismaAdmin.organization.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    // Provision exactly like signup-with-org: org + owner + starter templates
    // in one transaction, so both paths land on the same first-run experience.
    const org = await prismaAdmin.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: {
          name,
          slug,
          members: { create: { userId: session.userId, role: "owner" } },
        },
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

    const stripe = getStripe();
    if (stripe) {
      try {
        const customer = await stripe.customers.create({ email: session.email, name, metadata: { orgId: org.id } });
        await prismaAdmin.organization.update({ where: { id: org.id }, data: { stripeCustomerId: customer.id } });
      } catch (err) {
        console.error("Stripe customer creation failed (non-fatal):", err);
      }
    }

    session.orgId = org.id;
    session.orgRole = "owner";
    await session.save();

    return NextResponse.json(
      { org },
      { status: 201, headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("POST /api/orgs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
