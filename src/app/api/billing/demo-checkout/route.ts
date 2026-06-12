import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prismaAdmin } from "@/lib/db";
import { isDemoBilling } from "@/lib/demo";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEMO_PERIOD_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    // Outside demo billing this endpoint doesn't exist — plain 404, nothing revealed.
    if (!isDemoBilling()) return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!["owner", "admin"].includes(session.orgRole)) {
      return NextResponse.json({ error: "Only owners or admins can manage billing" }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    // Cross-context billing-state write → admin client, same rule as the Stripe webhook.
    const org = await prismaAdmin.organization.findUnique({
      where: { id: session.orgId },
      select: { id: true, stripeCustomerId: true },
    });
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

    const now = new Date();
    await prismaAdmin.organization.update({
      where: { id: org.id },
      data: {
        subscriptionStatus: "active",
        stripeSubscriptionId: `demo_sub_${crypto.randomUUID()}`,
        // Keep an existing customer id (real or demo) — only fill when absent.
        ...(org.stripeCustomerId ? {} : { stripeCustomerId: `demo_cus_${crypto.randomUUID()}` }),
        currentPeriodEnd: new Date(now.getTime() + DEMO_PERIOD_DAYS * DAY_MS),
        lastStripeEventAt: now,
      },
    });

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } });
  } catch (error) {
    console.error("POST /api/billing/demo-checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
