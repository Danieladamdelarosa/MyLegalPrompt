import { Check } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUsageStatus } from "@/lib/usage";
import { PLANS, getPlan } from "@/lib/plans";
import { isStripeConfigured } from "@/lib/stripe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpgradeButton, ManageBillingButton } from "@/components/billing/billing-actions";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    prisma.subscription.findUnique({ where: { userId } }),
  ]);

  const plan = user?.plan ?? "FREE";
  const planConfig = getPlan(plan);
  const usage = await getUsageStatus(userId, plan);
  const billingEnabled = isStripeConfigured();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-muted-foreground">Manage your plan and usage.</p>
      </div>

      {status === "success" && (
        <Card className="border-risk-low/40 bg-risk-low/5">
          <CardContent className="pt-6 text-sm">
            🎉 Your subscription is active. It may take a few seconds to reflect here.
          </CardContent>
        </Card>
      )}
      {status === "cancelled" && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Checkout was cancelled. You can upgrade any time.
          </CardContent>
        </Card>
      )}

      {/* Current plan + usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Current plan
            <Badge className={plan === "PRO" ? "border-primary text-primary" : ""}>
              {planConfig.name}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Analyses this month</span>
              <span className="font-medium">{usage.used} / {usage.limit}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
              />
            </div>
          </div>
          {subscription?.currentPeriodEnd && plan === "PRO" && (
            <p className="text-sm text-muted-foreground">
              {subscription.cancelAtPeriodEnd
                ? `Your plan ends on ${formatDate(subscription.currentPeriodEnd)}.`
                : `Renews on ${formatDate(subscription.currentPeriodEnd)}.`}
            </p>
          )}
          {plan === "PRO" && billingEnabled && <ManageBillingButton />}
        </CardContent>
      </Card>

      {!billingEnabled && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Payments are not yet configured on this deployment. Add your Stripe
            keys and Pro price ID to enable upgrades.
          </CardContent>
        </Card>
      )}

      {/* Plan comparison */}
      <div className="grid gap-6 sm:grid-cols-2">
        {Object.values(PLANS).map((p) => {
          const isCurrent = p.id === plan;
          return (
            <Card key={p.id} className={p.id === "PRO" ? "border-primary" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  {isCurrent && <Badge>Current</Badge>}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{p.priceLabel}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="mt-6 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {p.id === "PRO" && plan === "FREE" && billingEnabled && (
                  <div className="mt-6">
                    <UpgradeButton />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
