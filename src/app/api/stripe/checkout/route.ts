import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { audit } from "@/lib/audit";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// POST /api/stripe/checkout — start a Pro subscription Checkout session.
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured on this deployment." },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const userId = session.user.id;

  // Reuse an existing Stripe customer or create one.
  let sub = await prisma.subscription.findUnique({ where: { userId } });
  let customerId = sub?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    sub = await prisma.subscription.upsert({
      where: { userId },
      create: { userId, stripeCustomerId: customerId },
      update: { stripeCustomerId: customerId },
    });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${APP_URL}/billing?status=success`,
    cancel_url: `${APP_URL}/billing?status=cancelled`,
    allow_promotion_codes: true,
    subscription_data: { metadata: { userId } },
    metadata: { userId },
  });

  await audit("BILLING_CHECKOUT", { userId });
  return NextResponse.json({ url: checkout.url });
}
