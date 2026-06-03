import { z } from "zod";

/**
 * Canonical structured result returned by the AI analysis engine.
 * Validated with zod so we never persist malformed model output.
 */

export const RiskLevelSchema = z.enum(["LOW", "MODERATE", "HIGH"]);
export type RiskLevelT = z.infer<typeof RiskLevelSchema>;

export const ClauseTypeSchema = z.enum([
  "NON_COMPETE",
  "ARBITRATION",
  "CONFIDENTIALITY",
  "LIABILITY",
  "INDEMNIFICATION",
  "AUTO_RENEWAL",
  "CANCELLATION",
  "PAYMENT",
  "TERMINATION",
  "OTHER",
]);
export type ClauseType = z.infer<typeof ClauseTypeSchema>;

export const DetectedClauseSchema = z.object({
  type: ClauseTypeSchema,
  title: z.string(),
  explanation: z.string(),
  riskLevel: RiskLevelSchema,
  /** Verbatim excerpt from the source document, if present. */
  excerpt: z.string().optional().default(""),
});
export type DetectedClause = z.infer<typeof DetectedClauseSchema>;

export const ObligationSchema = z.object({
  description: z.string(),
  deadline: z.string().optional().default(""),
});

export const ImportantDateSchema = z.object({
  label: z.string(),
  date: z.string(),
  significance: z.string(),
});

export const RiskItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: RiskLevelSchema,
});

/** A paired segment for the side-by-side original ⇄ plain-English view. */
export const SideBySideSegmentSchema = z.object({
  original: z.string(),
  plainEnglish: z.string(),
  riskLevel: RiskLevelSchema.optional().default("LOW"),
});

export const AnalysisResultSchema = z.object({
  executiveSummary: z.string(),
  plainEnglishTranslation: z.string(),
  documentType: z.string().optional().default("Legal document"),

  riskScore: z.number().int().min(0).max(100),
  riskLevel: RiskLevelSchema,
  riskRationale: z.string().optional().default(""),

  keyClauses: z.array(DetectedClauseSchema).default([]),

  userObligations: z.array(ObligationSchema).default([]),
  otherPartyObligations: z.array(ObligationSchema).default([]),

  importantDates: z.array(ImportantDateSchema).default([]),
  renewalTerms: z.string().optional().default(""),
  terminationClauses: z.string().optional().default(""),
  paymentRequirements: z.string().optional().default(""),

  potentialRisks: z.array(RiskItemSchema).default([]),
  redFlags: z.array(z.string()).default([]),
  recommendedQuestions: z.array(z.string()).default([]),
  keyTakeaways: z.array(z.string()).default([]),

  sideBySide: z.array(SideBySideSegmentSchema).default([]),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const CLAUSE_LABELS: Record<ClauseType, string> = {
  NON_COMPETE: "Non-Compete",
  ARBITRATION: "Arbitration",
  CONFIDENTIALITY: "Confidentiality",
  LIABILITY: "Liability",
  INDEMNIFICATION: "Indemnification",
  AUTO_RENEWAL: "Auto-Renewal",
  CANCELLATION: "Cancellation",
  PAYMENT: "Payment",
  TERMINATION: "Termination",
  OTHER: "Other",
};
