import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prismaAdmin } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!["owner", "admin"].includes(session.orgRole)) {
      return NextResponse.json({ error: "Only owners or admins can manage billing" }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const stripe = getStripe();
    const priceId = process.env.STRIPE_PRICE_ID?.trim();
    if (!stripe || !priceId) {
      return NextResponse.json({ error: "Billing is not configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    // Cross-context read/write of the org's Stripe customer → admin client.
    const org = await prismaAdmin.organization.findUnique({
      where: { id: session.orgId },
      select: { id: true, name: true, stripeCustomerId: true },
    });
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ name: org.name, metadata: { orgId: org.id } });
      customerId = customer.id;
      await prismaAdmin.organization.update({ where: { id: org.id }, data: { stripeCustomerId: customerId } });
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL?.trim() || new URL(request.url).origin;
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/billing?status=success`,
      cancel_url: `${base}/billing?status=cancelled`,
    });

    return NextResponse.json({ url: checkout.url }, { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } });
  } catch (error) {
    console.error("POST /api/billing/checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
