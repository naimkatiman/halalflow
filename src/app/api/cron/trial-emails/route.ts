import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prismaAdmin } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";
import { TRIAL_DAYS, trialDaysLeft } from "@/lib/subscription";
import { isEmailConfigured, sendEmail, type EmailMessage } from "@/lib/notifications/email";
import { buildTrialReminderEmail, buildTrialWinbackEmail } from "@/lib/notifications/trial-email";

export const dynamic = "force-dynamic";

// Reminder goes out with a week of trial left; win-back a week after it ends.
const REMINDER_LEAD_DAYS = 7;
const WINBACK_LAG_DAYS = 7;
// Win-backs stop after this many further days: orgs that abandoned long before
// this feature existed (or any backlog) age out instead of getting bulk-mailed.
const WINBACK_WINDOW_DAYS = 30;
// Bound each run so a backlog can't stall the cron; the next tick drains more.
const BATCH_SIZE = 50;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

// Constant-time bearer check: hashing both sides gives timingSafeEqual
// equal-length inputs and leaks nothing about where a mismatch occurred.
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const provided = crypto.createHash("sha256").update(request.headers.get("authorization") ?? "").digest();
  const expected = crypto.createHash("sha256").update(`Bearer ${secret}`).digest();
  return crypto.timingSafeEqual(provided, expected);
}

/** Orgs on the card-free default trial that haven't received the given email. */
function defaultTrialWhere(sentField: "trialReminderSentAt" | "trialWinbackSentAt") {
  return {
    subscriptionStatus: "trialing",
    stripeSubscriptionId: null,
    [sentField]: null,
  };
}

// Owners and admins are the people who can act on billing.
const billingManagersSelect = {
  id: true,
  name: true,
  createdAt: true,
  members: {
    where: { role: { in: ["owner", "admin"] } },
    select: { user: { select: { email: true } } },
  },
};

export async function GET(request: NextRequest) {
  // A single 401 for both "no secret configured" and "wrong secret" — callers
  // can't fingerprint the deployment's configuration state.
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Without Stripe there is no paywall, so trials never end — nothing to announce.
  if (!isStripeConfigured()) {
    return NextResponse.json({ ok: true, skipped: "stripe-unconfigured" });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json({ ok: true, skipped: "email-unconfigured" });
  }

  const now = new Date();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim() || "https://halalflow-production.up.railway.app";
  const billingUrl = `${baseUrl}/billing`;

  try {
    // Reminder window: ≤ REMINDER_LEAD_DAYS of trial left but not expired yet.
    const reminderOrgs = await prismaAdmin.organization.findMany({
      where: {
        ...defaultTrialWhere("trialReminderSentAt"),
        createdAt: {
          lte: daysAgo(now, TRIAL_DAYS - REMINDER_LEAD_DAYS),
          gt: daysAgo(now, TRIAL_DAYS),
        },
      },
      select: billingManagersSelect,
      take: BATCH_SIZE,
    });

    // Win-back: trial ended WINBACK_LAG_DAYS ago and the org never subscribed.
    // Lower bound keeps long-dead orgs from being bulk-mailed when this first
    // deploys (or after any cron outage longer than the window).
    const winbackOrgs = await prismaAdmin.organization.findMany({
      where: {
        ...defaultTrialWhere("trialWinbackSentAt"),
        createdAt: {
          lte: daysAgo(now, TRIAL_DAYS + WINBACK_LAG_DAYS),
          gt: daysAgo(now, TRIAL_DAYS + WINBACK_LAG_DAYS + WINBACK_WINDOW_DAYS),
        },
      },
      select: billingManagersSelect,
      take: BATCH_SIZE,
    });

    let remindersSent = 0;
    let winbacksSent = 0;
    const failures: string[] = [];

    // Claim-then-send: atomically stamp the org first so a concurrent run
    // skips it (updateMany on the still-NULL field — only one caller wins).
    // A failed send releases the claim so the next tick retries; a crash
    // between claim and send loses one marketing email, which beats sending
    // it twice.
    const sendClaimed = async (
      orgId: string,
      kind: "reminder" | "winback",
      message: EmailMessage
    ): Promise<boolean> => {
      const claim = await prismaAdmin.organization.updateMany({
        where:
          kind === "reminder"
            ? { id: orgId, trialReminderSentAt: null }
            : { id: orgId, trialWinbackSentAt: null },
        data: kind === "reminder" ? { trialReminderSentAt: now } : { trialWinbackSentAt: now },
      });
      if (claim.count === 0) return false; // another run already owns it
      const result = await sendEmail(message);
      if (result.ok) return true;
      await prismaAdmin.organization.update({
        where: { id: orgId },
        data: kind === "reminder" ? { trialReminderSentAt: null } : { trialWinbackSentAt: null },
      });
      failures.push(`${kind}:${orgId}:${result.reason}`);
      return false;
    };

    for (const org of reminderOrgs) {
      const to = org.members.map((m) => m.user.email);
      if (to.length === 0) continue;
      const sent = await sendClaimed(
        org.id,
        "reminder",
        buildTrialReminderEmail(to, org.name, trialDaysLeft(org), billingUrl)
      );
      if (sent) remindersSent += 1;
    }

    for (const org of winbackOrgs) {
      const to = org.members.map((m) => m.user.email);
      if (to.length === 0) continue;
      const sent = await sendClaimed(org.id, "winback", buildTrialWinbackEmail(to, org.name, billingUrl));
      if (sent) winbacksSent += 1;
    }

    if (failures.length > 0) {
      console.error("trial-emails cron failures:", failures);
    }

    return NextResponse.json({
      ok: failures.length === 0,
      reminders: { candidates: reminderOrgs.length, sent: remindersSent },
      winbacks: { candidates: winbackOrgs.length, sent: winbacksSent },
      failures: failures.length,
    });
  } catch (error) {
    console.error("GET /api/cron/trial-emails error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
