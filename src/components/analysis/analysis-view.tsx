"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Columns2,
  FileText,
  HelpCircle,
  ListChecks,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/badge";
import { RiskGauge } from "./risk-gauge";
import {
  type AnalysisResult,
  type RiskLevelT,
  CLAUSE_LABELS,
} from "@/types/analysis";

const riskBorder: Record<RiskLevelT, string> = {
  LOW: "border-l-risk-low",
  MODERATE: "border-l-risk-moderate",
  HIGH: "border-l-risk-high",
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">{children}</CardContent>
    </Card>
  );
}

type Tab = "overview" | "clauses" | "obligations" | "sidebyside";

export function AnalysisView({
  result,
  originalText,
}: {
  result: AnalysisResult;
  originalText: string | null;
}) {
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Sparkles },
    { id: "clauses", label: "Clauses & Risks", icon: ShieldAlert },
    { id: "obligations", label: "Obligations & Dates", icon: CalendarClock },
    { id: "sidebyside", label: "Side-by-Side", icon: Columns2 },
  ];

  return (
    <div className="space-y-6">
      {/* Risk header */}
      <Card>
        <CardContent className="flex flex-col items-center gap-6 pt-6 sm:flex-row sm:items-start">
          <RiskGauge score={result.riskScore} level={result.riskLevel} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-lg font-semibold">{result.documentType || "Legal document"}</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{result.executiveSummary}</p>
            {result.riskRationale && (
              <p className="mt-3 rounded-lg bg-secondary p-3 text-sm">
                <span className="font-medium">Why this score: </span>
                {result.riskRationale}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section icon={FileText} title="Plain-English Translation">
            <p className="whitespace-pre-line leading-relaxed">{result.plainEnglishTranslation}</p>
          </Section>

          {result.keyTakeaways.length > 0 && (
            <Section icon={ListChecks} title="Key Takeaways">
              <ul className="space-y-2">
                {result.keyTakeaways.map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-risk-low" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {result.redFlags.length > 0 && (
            <Section icon={AlertTriangle} title="Red Flags">
              <ul className="space-y-2">
                {result.redFlags.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg border-l-4 border-l-risk-high bg-risk-high/5 p-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-risk-high" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {result.recommendedQuestions.length > 0 && (
            <Section icon={HelpCircle} title="Questions to Ask">
              <ul className="space-y-2">
                {result.recommendedQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}

      {/* Clauses & Risks */}
      {tab === "clauses" && (
        <div className="space-y-6">
          {result.keyClauses.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Detected Clauses</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.keyClauses.map((c, i) => (
                  <Card key={i} className={cn("border-l-4", riskBorder[c.riskLevel])}>
                    <CardContent className="space-y-2 pt-5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
                          {CLAUSE_LABELS[c.type]}
                        </span>
                        <RiskBadge level={c.riskLevel} />
                      </div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-sm text-muted-foreground">{c.explanation}</p>
                      {c.excerpt && (
                        <blockquote className="border-l-2 border-border pl-3 text-xs italic text-muted-foreground">
                          “{c.excerpt}”
                        </blockquote>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {result.potentialRisks.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Potential Risks</h3>
              <div className="space-y-3">
                {result.potentialRisks.map((r, i) => (
                  <Card key={i} className={cn("border-l-4", riskBorder[r.severity])}>
                    <CardContent className="flex items-start justify-between gap-3 pt-5">
                      <div>
                        <p className="font-medium">{r.title}</p>
                        <p className="text-sm text-muted-foreground">{r.description}</p>
                      </div>
                      <RiskBadge level={r.severity} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Obligations & Dates */}
      {tab === "obligations" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section icon={ListChecks} title="Your Obligations">
            {result.userObligations.length ? (
              <ul className="space-y-2">
                {result.userObligations.map((o, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      {o.description}
                      {o.deadline && <span className="text-muted-foreground"> — {o.deadline}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">None identified.</p>
            )}
          </Section>

          <Section icon={ListChecks} title="Other Party's Obligations">
            {result.otherPartyObligations.length ? (
              <ul className="space-y-2">
                {result.otherPartyObligations.map((o, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>
                      {o.description}
                      {o.deadline && <span className="text-muted-foreground"> — {o.deadline}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">None identified.</p>
            )}
          </Section>

          <Section icon={CalendarClock} title="Important Dates">
            {result.importantDates.length ? (
              <ul className="space-y-3">
                {result.importantDates.map((d, i) => (
                  <li key={i} className="rounded-lg bg-secondary p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{d.label}</span>
                      <span className="text-sm text-primary">{d.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{d.significance}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">None identified.</p>
            )}
          </Section>

          <Section icon={FileText} title="Key Terms">
            <dl className="space-y-3">
              <div>
                <dt className="font-medium">Payment</dt>
                <dd className="text-muted-foreground">{result.paymentRequirements || "Not specified."}</dd>
              </div>
              <div>
                <dt className="font-medium">Renewal</dt>
                <dd className="text-muted-foreground">{result.renewalTerms || "Not specified."}</dd>
              </div>
              <div>
                <dt className="font-medium">Termination</dt>
                <dd className="text-muted-foreground">{result.terminationClauses || "Not specified."}</dd>
              </div>
            </dl>
          </Section>
        </div>
      )}

      {/* Side-by-side */}
      {tab === "sidebyside" && (
        <SideBySide result={result} originalText={originalText} />
      )}
    </div>
  );
}

function SideBySide({
  result,
  originalText,
}: {
  result: AnalysisResult;
  originalText: string | null;
}) {
  if (result.sideBySide.length > 0) {
    return (
      <div className="space-y-3">
        <div className="hidden grid-cols-2 gap-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
          <span>Original</span>
          <span>Plain English</span>
        </div>
        {result.sideBySide.map((seg, i) => (
          <div
            key={i}
            className={cn(
              "grid gap-px overflow-hidden rounded-lg border-l-4 sm:grid-cols-2",
              riskBorder[seg.riskLevel ?? "LOW"]
            )}
          >
            <div className="bg-secondary/50 p-4 font-mono text-xs leading-relaxed">
              {seg.original}
            </div>
            <div className="bg-card p-4 text-sm leading-relaxed">
              {seg.plainEnglish}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback: original text alongside the plain-English translation.
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Original Document</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">
            {originalText || "Original text unavailable."}
          </pre>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Plain English</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-h-[600px] overflow-auto whitespace-pre-line text-sm leading-relaxed">
            {result.plainEnglishTranslation}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
