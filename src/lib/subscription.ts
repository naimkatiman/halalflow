import { isStripeConfigured } from "@/lib/stripe";

// Statuses that still grant access. `past_due` keeps the org running during
// Stripe's payment-retry grace window; only canceled/unpaid/incomplete lock out.
const ACTIVE_STATUSES = new Set(["trialing", "active", "past_due"]);

/**
 * Whether an org may use the product given its subscription status.
 *
 * The paywall is a no-op until Stripe is configured: with no STRIPE_SECRET_KEY
 * this always returns true, so self-hosters and pre-billing deployments are
 * never locked out. Once Stripe is wired, access follows the org's status.
 */
export function isSubscriptionActive(subscriptionStatus: string | null | undefined): boolean {
  if (!isStripeConfigured()) return true;
  return ACTIVE_STATUSES.has(subscriptionStatus ?? "");
}
