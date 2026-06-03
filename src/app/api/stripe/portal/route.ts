import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { audit } from "@/lib/audit";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// POST /api/stripe/portal — open the Stripe billing portal (manage/cancel/downgrade).
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });
  if (!sub?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found. Subscribe first." },
      { status: 400 }
    );
  }

  const portal = await getStripe().billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${APP_URL}/billing`,
  });

  await audit("BILLING_PORTAL", { userId: session.user.id });
  return NextResponse.json({ url: portal.url });
}
