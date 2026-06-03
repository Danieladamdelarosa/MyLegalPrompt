import type { Plan } from "@prisma/client";

export interface PlanConfig {
  id: Plan;
  name: string;
  priceLabel: string;
  priceMonthly: number;
  /** Analyses allowed per calendar month. */
  monthlyAnalyses: number;
  /** Maximum document length in pages. */
  maxPages: number;
  features: string[];
  exportReports: boolean;
  priorityProcessing: boolean;
}

export const PLANS: Record<Plan, PlanConfig> = {
  FREE: {
    id: "FREE",
    name: "Free",
    priceLabel: "$0",
    priceMonthly: 0,
    monthlyAnalyses: 3,
    maxPages: 10,
    exportReports: false,
    priorityProcessing: false,
    features: [
      "3 document analyses / month",
      "Up to 10 pages per document",
      "Plain-English explanations",
      "Risk score & clause detection",
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceLabel: "$9.99",
    priceMonthly: 9.99,
    monthlyAnalyses: 50,
    maxPages: 100,
    exportReports: true,
    priorityProcessing: true,
    features: [
      "50 document analyses / month",
      "Up to 100 pages per document",
      "Everything in Free",
      "Export reports (PDF)",
      "Priority processing",
    ],
  },
};

export function getPlan(plan: Plan): PlanConfig {
  return PLANS[plan] ?? PLANS.FREE;
}
