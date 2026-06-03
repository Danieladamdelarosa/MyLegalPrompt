import type { RiskLevelT } from "@/types/analysis";
import { cn } from "@/lib/utils";

const colorByLevel: Record<RiskLevelT, string> = {
  LOW: "hsl(var(--risk-low))",
  MODERATE: "hsl(var(--risk-moderate))",
  HIGH: "hsl(var(--risk-high))",
};

const labelByLevel: Record<RiskLevelT, string> = {
  LOW: "Low Risk",
  MODERATE: "Moderate Risk",
  HIGH: "High Risk",
};

/** Circular risk-score gauge (0–100). */
export function RiskGauge({
  score,
  level,
}: {
  score: number;
  level: RiskLevelT;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = colorByLevel[level];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="10"
            className="stroke-secondary"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span
        className={cn("mt-2 text-sm font-semibold")}
        style={{ color }}
      >
        {labelByLevel[level]}
      </span>
    </div>
  );
}
