import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prismaAdmin } from "@/lib/db";

// Stripe needs the raw, unparsed body to verify the signature.
export const dynamic = "force-dynamic";

function periodEnd(sub: Stripe.Subscription): Date | null {
  // `current_period_end` lives at the top level on older API versions and on the
  // first item on newer ones — read defensively (unix seconds → Date).
  const loose = sub as unknown as {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  };
  const ts = loose.current_period_end ?? loose.items?.data?.[0]?.current_period_end;
  return typeof ts === "number" ? new Date(ts * 1000) : null;
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const eventAt = new Date(event.created * 1000);
        // Stripe delivers webhooks out of order; the lastStripeEventAt filter
        // makes stale events a no-op instead of overwriting newer state.
        await prismaAdmin.organization.updateMany({
          where: {
            stripeCustomerId: customerId,
            OR: [{ lastStripeEventAt: null }, { lastStripeEventAt: { lt: eventAt } }],
          },
          data: {
            stripeSubscriptionId: sub.id,
            subscriptionStatus: sub.status,
            currentPeriodEnd: periodEnd(sub),
            lastStripeEventAt: eventAt,
          },
        });
        break;
      }
      case "checkout.session.completed": {
        const checkout = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof checkout.customer === "string" ? checkout.customer : checkout.customer?.id;
        const subscriptionId =
          typeof checkout.subscription === "string" ? checkout.subscription : checkout.subscription?.id;
        if (customerId && subscriptionId) {
          // Read the real status from Stripe rather than assuming "active" — a
          // trial checkout should land as "trialing", not be force-activated.
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const eventAt = new Date(event.created * 1000);
          await prismaAdmin.organization.updateMany({
            where: {
              stripeCustomerId: customerId,
              OR: [{ lastStripeEventAt: null }, { lastStripeEventAt: { lt: eventAt } }],
            },
            data: {
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: sub.status,
              currentPeriodEnd: periodEnd(sub),
              lastStripeEventAt: eventAt,
            },
          });
        }
        break;
      }
      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook handler error (${event.type}):`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
