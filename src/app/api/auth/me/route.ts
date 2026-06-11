import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prismaAdmin } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { isStripeConfigured } from "@/lib/stripe";
import { isOnDefaultTrial, trialDaysLeft } from "@/lib/subscription";

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    // Own-org lookup keyed by the session — safe for prismaAdmin.
    const org = session.orgId
      ? await prismaAdmin.organization.findUnique({
          where: { id: session.orgId },
          select: {
            name: true,
            subscriptionStatus: true,
            stripeSubscriptionId: true,
            createdAt: true,
          },
        })
      : null;

    // Surfaced so the UI can count down the card-free trial; null whenever
    // billing is off or the org has a real Stripe subscription.
    const trial =
      org && isStripeConfigured() && isOnDefaultTrial(org)
        ? { daysLeft: trialDaysLeft(org) }
        : null;

    return NextResponse.json(
      {
        user: {
          id: session.userId,
          email: session.email,
          name: session.name,
          role: session.role,
          orgId: session.orgId,
          orgRole: session.orgRole,
          orgName: org?.name ?? null,
          trial,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
