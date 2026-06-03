import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { currentPeriodKey } from "@/lib/utils";
import type { Plan } from "@prisma/client";

export interface UsageStatus {
  plan: Plan;
  used: number;
  limit: number;
  remaining: number;
  maxPages: number;
  periodKey: string;
}

/** Current month's usage for a user, with plan limits resolved. */
export async function getUsageStatus(
  userId: string,
  plan: Plan
): Promise<UsageStatus> {
  const periodKey = currentPeriodKey();
  const record = await prisma.usageRecord.findUnique({
    where: { userId_periodKey: { userId, periodKey } },
  });
  const config = getPlan(plan);
  const used = record?.analyses ?? 0;
  return {
    plan,
    used,
    limit: config.monthlyAnalyses,
    remaining: Math.max(0, config.monthlyAnalyses - used),
    maxPages: config.maxPages,
    periodKey,
  };
}

export interface QuotaCheck {
  allowed: boolean;
  reason?: "ANALYSIS_LIMIT" | "PAGE_LIMIT";
  status: UsageStatus;
}

/** Verify the user can run another analysis of `pageCount` pages. */
export async function checkQuota(
  userId: string,
  plan: Plan,
  pageCount: number
): Promise<QuotaCheck> {
  const status = await getUsageStatus(userId, plan);
  if (status.remaining <= 0) {
    return { allowed: false, reason: "ANALYSIS_LIMIT", status };
  }
  if (pageCount > status.maxPages) {
    return { allowed: false, reason: "PAGE_LIMIT", status };
  }
  return { allowed: true, status };
}

/** Atomically increment this month's analysis count. */
export async function incrementUsage(userId: string): Promise<void> {
  const periodKey = currentPeriodKey();
  await prisma.usageRecord.upsert({
    where: { userId_periodKey: { userId, periodKey } },
    create: { userId, periodKey, analyses: 1 },
    update: { analyses: { increment: 1 } },
  });
}
