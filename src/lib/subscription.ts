import { isStripeConfigured } from "@/lib/stripe";

// Statuses that still grant access. `past_due` keeps the org running during
// Stripe's payment-retry grace window; only canceled/unpaid/incomplete lock out.
const ACTIVE_STATUSES = new Set(["trialing", "active", "past_due"]);

// Orgs are born `trialing` (schema default) with no Stripe subscription. That
// default trial is time-boxed from org creation; mirrors the 30-day trial
// configured on the Stripe price so checkout never shortens anyone's window.
export const TRIAL_DAYS = 30;

// How long past a recorded currentPeriodEnd `active`/`trialing` keep access
// before the record counts as stale. Renewal webhooks normally land within
// minutes; the grace only matters during a webhook outage, and failing closed
// after it beats silently granting service forever.
const PERIOD_END_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

/** The org fields subscription decisions are made from. */
export interface SubscriptionState {
  subscriptionStatus: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
}

/** When the card-free default trial ends for an org that never checked out. */
export function trialEndsAt(org: Pick<SubscriptionState, "createdAt">): Date {
  return new Date(org.createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

/** Whole days of default trial remaining (0 when expired). */
export function trialDaysLeft(org: Pick<SubscriptionState, "createdAt">): number {
  const msLeft = trialEndsAt(org).getTime() - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

/** True when the org is on the time-boxed default trial (never checked out). */
export function isOnDefaultTrial(
  org: Pick<SubscriptionState, "subscriptionStatus" | "stripeSubscriptionId">
): boolean {
  return org.subscriptionStatus === "trialing" && !org.stripeSubscriptionId;
}

/**
 * Whether an org may use the product given its subscription state.
 *
 * The paywall is a no-op until Stripe is configured: with no STRIPE_SECRET_KEY
 * this always returns true, so self-hosters and pre-billing deployments are
 * never locked out. Once Stripe is wired:
 *  - default trial (no Stripe subscription yet) expires TRIAL_DAYS after the
 *    org was created — "trialing" alone is no longer a forever pass;
 *  - past_due rides on status alone, since Stripe holds currentPeriodEnd at
 *    the lapsed date during its retry window and moves the status by webhook;
 *  - active/trialing subscriptions whose currentPeriodEnd is long past are
 *    treated as missed webhooks and fail closed after a grace window.
 */
export function isSubscriptionActive(org: SubscriptionState): boolean {
  if (!isStripeConfigured()) return true;
  if (!ACTIVE_STATUSES.has(org.subscriptionStatus ?? "")) return false;
  if (isOnDefaultTrial(org)) return Date.now() < trialEndsAt(org).getTime();
  if (org.subscriptionStatus === "past_due") return true;
  if (
    org.currentPeriodEnd &&
    Date.now() > org.currentPeriodEnd.getTime() + PERIOD_END_GRACE_MS
  ) {
    return false;
  }
  return true;
}
