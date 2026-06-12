import { prismaAdmin } from "@/lib/db";
import { TRIAL_DAYS, trialDaysLeft } from "@/lib/subscription";
import { sendEmail, type EmailMessage } from "@/lib/notifications/email";
import { buildTrialReminderEmail, buildTrialWinbackEmail } from "@/lib/notifications/trial-email";

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

/**
 * One pass of the trial lifecycle emails: day-23 reminders for orgs nearing
 * the end of the card-free default trial, day-37 win-backs for orgs whose
 * trial lapsed without a subscription. Extracted from the trial-emails cron
 * route (which keeps the auth and skip gates) so the demo controls can run
 * the exact same sweep on demand.
 */
export async function runTrialEmailSweep(): Promise<{
  reminders: { candidates: number; sent: number };
  winbacks: { candidates: number; sent: number };
  failures: string[];
}> {
  const now = new Date();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim() || "https://halalflow-production.up.railway.app";
  const billingUrl = `${baseUrl}/billing`;

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

  return {
    reminders: { candidates: reminderOrgs.length, sent: remindersSent },
    winbacks: { candidates: winbackOrgs.length, sent: winbacksSent },
    failures,
  };
}
