import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import type { Plan, SubscriptionStatus } from "@prisma/client";

export const runtime = "nodejs";

// Map Stripe subscription status → our enum.
function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "unpaid":
      return "UNPAID";
    default:
      return "INCOMPLETE";
  }
}

async function syncSubscription(sub: Stripe.Subscription) {
  const userId =
    (sub.metadata?.userId as string | undefined) ??
    (await prisma.subscription.findFirst({
      where: { stripeCustomerId: sub.customer as string },
      select: { userId: true },
    }))?.userId;

  if (!userId) {
    console.warn("[stripe] subscription without resolvable userId", sub.id);
    return;
  }

  const status = mapStatus(sub.status);
  // Pro while the subscription is in a paying/active state; otherwise Free.
  const isActive = status === "ACTIVE" || status === "TRIALING";
  const plan: Plan = isActive ? "PRO" : "FREE";
  // `current_period_end` location varies across Stripe API versions
  // (top-level on older versions, per-item on newer ones).
  const periodEnd =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (sub.items.data[0] as unknown as { current_period_end?: number })
      ?.current_period_end;

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: sub.customer as string,
        stripeSubscriptionId: sub.id,
        stripePriceId: sub.items.data[0]?.price.id,
        plan,
        status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
      update: {
        stripeSubscriptionId: sub.id,
        stripePriceId: sub.items.data[0]?.price.id,
        plan,
        status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    }),
    prisma.user.update({ where: { id: userId }, data: { plan } }),
  ]);

  await audit(plan === "PRO" ? "BILLING_UPGRADE" : "BILLING_DOWNGRADE", {
    userId,
    metadata: { status, subscriptionId: sub.id },
  });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  const payload = await req.text();
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error("[stripe] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        if (cs.subscription) {
          const sub = await getStripe().subscriptions.retrieve(
            cs.subscription as string
          );
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe] handler error", event.type, err);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
