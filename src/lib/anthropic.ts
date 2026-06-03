import Anthropic from "@anthropic-ai/sdk";
import { AnalysisResult, AnalysisResultSchema, RiskLevelT } from "@/types/analysis";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_BASE_URL) {
    throw new Error(
      "Anthropic is not configured. Set ANTHROPIC_API_KEY in the environment."
    );
  }
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
    });
  }
  return client;
}

const SYSTEM_PROMPT = `You are MyLegalPrompt, an expert legal analyst that explains legal documents to everyday people (consumers, freelancers, small-business owners, renters, and job seekers) in plain English.

You are NOT a lawyer and your output is NOT legal advice — but you are precise, practical, and protective of the reader's interests. Read the document carefully and surface anything that could cost the reader money, time, rights, or flexibility.

Rules:
- Write in clear, plain English at roughly an 8th-grade reading level. No legalese unless you immediately define it.
- Be specific. Quote short verbatim excerpts from the document when identifying clauses.
- Never invent facts. If something isn't in the document, leave that field empty rather than guessing.
- Assess risk from the reader's perspective: harsh termination terms, broad liability/indemnification, automatic renewals, mandatory arbitration, non-competes, and hidden or one-sided fees all increase risk.
- Always respond by calling the \`submit_analysis\` tool with the structured result. Do not write prose outside the tool call.`;

// Tool schema mirrors AnalysisResultSchema so the model returns structured JSON.
const ANALYSIS_TOOL: Anthropic.Tool = {
  name: "submit_analysis",
  description: "Submit the structured plain-English analysis of the legal document.",
  input_schema: {
    type: "object",
    properties: {
      documentType: { type: "string", description: "e.g. Employment Agreement, Lease, NDA, SaaS Terms" },
      executiveSummary: { type: "string", description: "2-4 sentence high-level summary." },
      plainEnglishTranslation: {
        type: "string",
        description: "A plain-English walkthrough of what this document means for the reader.",
      },
      riskScore: { type: "integer", description: "Overall risk 0 (very safe) to 100 (very risky)." },
      riskLevel: { type: "string", enum: ["LOW", "MODERATE", "HIGH"] },
      riskRationale: { type: "string", description: "Why this risk score was assigned." },
      keyClauses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "NON_COMPETE", "ARBITRATION", "CONFIDENTIALITY", "LIABILITY",
                "INDEMNIFICATION", "AUTO_RENEWAL", "CANCELLATION", "PAYMENT",
                "TERMINATION", "OTHER",
              ],
            },
            title: { type: "string" },
            explanation: { type: "string", description: "What this clause means in plain English." },
            riskLevel: { type: "string", enum: ["LOW", "MODERATE", "HIGH"] },
            excerpt: { type: "string", description: "Short verbatim quote from the document." },
          },
          required: ["type", "title", "explanation", "riskLevel"],
        },
      },
      userObligations: {
        type: "array",
        items: {
          type: "object",
          properties: { description: { type: "string" }, deadline: { type: "string" } },
          required: ["description"],
        },
      },
      otherPartyObligations: {
        type: "array",
        items: {
          type: "object",
          properties: { description: { type: "string" }, deadline: { type: "string" } },
          required: ["description"],
        },
      },
      importantDates: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            date: { type: "string" },
            significance: { type: "string" },
          },
          required: ["label", "date", "significance"],
        },
      },
      renewalTerms: { type: "string" },
      terminationClauses: { type: "string" },
      paymentRequirements: { type: "string" },
      potentialRisks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            severity: { type: "string", enum: ["LOW", "MODERATE", "HIGH"] },
          },
          required: ["title", "description", "severity"],
        },
      },
      redFlags: { type: "array", items: { type: "string" } },
      recommendedQuestions: { type: "array", items: { type: "string" } },
      keyTakeaways: { type: "array", items: { type: "string" } },
      sideBySide: {
        type: "array",
        description: "Pair meaningful sections of the original text with their plain-English version.",
        items: {
          type: "object",
          properties: {
            original: { type: "string" },
            plainEnglish: { type: "string" },
            riskLevel: { type: "string", enum: ["LOW", "MODERATE", "HIGH"] },
          },
          required: ["original", "plainEnglish"],
        },
      },
    },
    required: [
      "executiveSummary", "plainEnglishTranslation", "riskScore", "riskLevel",
      "keyClauses", "potentialRisks", "redFlags", "recommendedQuestions", "keyTakeaways",
    ],
  },
};

function deriveRiskLevel(score: number): RiskLevelT {
  if (score >= 67) return "HIGH";
  if (score >= 34) return "MODERATE";
  return "LOW";
}

export interface AnalyzeResult {
  result: AnalysisResult;
  modelUsed: string;
  tokensUsed: number;
}

/**
 * Analyze extracted document text and return a validated structured result.
 * Truncates extremely long documents to protect the context window.
 */
export async function analyzeDocument(
  text: string,
  filename: string
): Promise<AnalyzeResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Document contains no readable text.");
  }

  // ~150k chars is a safe cap for the model context here.
  const MAX_CHARS = 150_000;
  const content =
    trimmed.length > MAX_CHARS
      ? trimmed.slice(0, MAX_CHARS) + "\n\n[Document truncated for length.]"
      : trimmed;

  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    tools: [ANALYSIS_TOOL],
    tool_choice: { type: "tool", name: "submit_analysis" },
    messages: [
      {
        role: "user",
        content: `Analyze the following legal document titled "${filename}". Provide a complete plain-English analysis for a non-lawyer reader.\n\n--- DOCUMENT START ---\n${content}\n--- DOCUMENT END ---`,
      },
    ],
  });

  const toolUse = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("The analysis engine did not return a structured result.");
  }

  // Validate & normalize. riskLevel is always re-derived from the numeric
  // score so the two never disagree in the UI.
  const parsed = AnalysisResultSchema.parse(toolUse.input);
  parsed.riskLevel = deriveRiskLevel(parsed.riskScore);

  const tokensUsed =
    (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0);

  return { result: parsed, modelUsed: MODEL, tokensUsed };
}
