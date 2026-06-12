import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prismaAdmin } from "@/lib/db";
import { isDemoBilling } from "@/lib/demo";
import { runTrialEmailSweep } from "@/lib/trial-email-sweep";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { z } from "zod";

const DAY_MS = 24 * 60 * 60 * 1000;

const bodySchema = z.object({
  action: z.enum(["day23", "day31", "day37", "reset", "sweep"]),
});

// Every rewind also returns the org to the card-free default trial so the
// trial/paywall logic and the cron's email windows re-match from scratch.
const defaultTrial = {
  subscriptionStatus: "trialing",
  stripeSubscriptionId: null,
  currentPeriodEnd: null,
};

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

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

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    const { action } = parsed.data;

    if (action === "sweep") {
      // Same function the cron route delegates to — what the audience sees is the real sweep.
      const result = await runTrialEmailSweep();
      return NextResponse.json(
        { ok: true, action, reminders: result.reminders.sent, winbacks: result.winbacks.sent },
        { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } }
      );
    }

    const now = new Date();
    const data =
      action === "day23"
        ? // Day 23: inside the reminder window; clear the stamp so the sweep resends.
          { ...defaultTrial, createdAt: daysAgo(now, 23), trialReminderSentAt: null }
        : action === "day31"
          ? // Day 31: trial expired — the paywall locks the org out.
            { ...defaultTrial, createdAt: daysAgo(now, 31) }
          : action === "day37"
            ? // Day 37: inside the win-back window; clear the stamp so the sweep resends.
              { ...defaultTrial, createdAt: daysAgo(now, 37), trialWinbackSentAt: null }
            : // Reset: fresh trial from today, both sent-stamps cleared.
              { ...defaultTrial, createdAt: now, trialReminderSentAt: null, trialWinbackSentAt: null };

    // Cross-context billing-state write → admin client, same rule as the Stripe webhook.
    await prismaAdmin.organization.update({ where: { id: session.orgId }, data });

    return NextResponse.json(
      { ok: true, action },
      { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } }
    );
  } catch (error) {
    console.error("POST /api/billing/demo-controls error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
