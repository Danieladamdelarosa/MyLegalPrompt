import * as React from "react";
import { cn } from "@/lib/utils";
import type { RiskLevelT } from "@/types/analysis";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      {...props}
    />
  );
}

const riskStyles: Record<RiskLevelT, string> = {
  LOW: "bg-risk-low/10 text-risk-low border-risk-low/30",
  MODERATE: "bg-risk-moderate/10 text-risk-moderate border-risk-moderate/30",
  HIGH: "bg-risk-high/10 text-risk-high border-risk-high/30",
};

const riskLabels: Record<RiskLevelT, string> = {
  LOW: "Low Risk",
  MODERATE: "Moderate Risk",
  HIGH: "High Risk",
};

export function RiskBadge({
  level,
  className,
}: {
  level: RiskLevelT;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        riskStyles[level],
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-risk-low": level === "LOW",
          "bg-risk-moderate": level === "MODERATE",
          "bg-risk-high": level === "HIGH",
        })}
      />
      {riskLabels[level]}
    </span>
  );
}
