import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import { parseFile } from "@/lib/file-parser";
import { validateUpload } from "@/lib/validation";
import { analyzeDocument } from "@/lib/anthropic";
import { checkQuota, incrementUsage } from "@/lib/usage";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import type { FileType } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 120;

const EXT_BY_TYPE: Record<FileType, string> = { PDF: "pdf", DOCX: "docx", TXT: "txt" };

// GET /api/documents — list current user's documents (most recent first).
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      fileType: true,
      fileSize: true,
      pageCount: true,
      status: true,
      createdAt: true,
      analysis: { select: { riskScore: true, riskLevel: true, createdAt: true } },
    },
  });
  return NextResponse.json({ documents });
}

// POST /api/documents — upload + analyze a document in one request.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const ip = getClientIp(req.headers);

  // Throttle uploads: 10 per minute per user.
  const limit = rateLimit(`upload:${userId}`, 10, 60_000);
  if (!limit.success) {
    await audit("RATE_LIMITED", { userId, ipAddress: ip, metadata: { route: "upload" } });
    return NextResponse.json(
      { error: "You're uploading too quickly. Please wait a moment." },
      { status: 429 }
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateUpload(file.name, file.type, buffer.length, buffer);
  if (!validation.ok || !validation.fileType) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const fileType = validation.fileType;

  // Parse text + page count up front so we can enforce the page limit before
  // spending an analysis credit or calling the model.
  let parsed;
  try {
    parsed = await parseFile(buffer, fileType);
  } catch {
    return NextResponse.json(
      { error: "We couldn't read that file. It may be corrupted or password-protected." },
      { status: 422 }
    );
  }

  if (!parsed.text.trim()) {
    return NextResponse.json(
      { error: "No readable text found. Scanned/image-only PDFs aren't supported yet." },
      { status: 422 }
    );
  }

  // Enforce plan limits (read plan fresh from DB, not just the JWT).
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  const quota = await checkQuota(userId, user?.plan ?? "FREE", parsed.pageCount);
  if (!quota.allowed) {
    const msg =
      quota.reason === "PAGE_LIMIT"
        ? `This document has ${parsed.pageCount} pages, but your plan allows up to ${quota.status.maxPages}. Upgrade to analyze longer documents.`
        : `You've used all ${quota.status.limit} analyses this month. Upgrade to Pro for more.`;
    return NextResponse.json(
      { error: msg, reason: quota.reason }, { status: 402 }
    );
  }

  // Persist the original file + a document record.
  const storageKey = await storage.put(buffer, EXT_BY_TYPE[fileType]);
  const document = await prisma.document.create({
    data: {
      userId,
      filename: file.name.slice(0, 255),
      fileType,
      fileSize: buffer.length,
      pageCount: parsed.pageCount,
      storageKey,
      extractedText: parsed.text,
      status: "PROCESSING",
    },
  });

  await audit("DOCUMENT_UPLOAD", {
    userId,
    ipAddress: ip,
    metadata: { documentId: document.id, fileType, pages: parsed.pageCount },
  });

  // Run the analysis. Increment usage only on success.
  try {
    const { result, modelUsed, tokensUsed } = await analyzeDocument(
      parsed.text,
      document.filename
    );

    await prisma.$transaction([
      prisma.analysis.create({
        data: {
          documentId: document.id,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          executiveSummary: result.executiveSummary,
          result,
          modelUsed,
          tokensUsed,
        },
      }),
      prisma.document.update({
        where: { id: document.id },
        data: { status: "ANALYZED" },
      }),
    ]);
    await incrementUsage(userId);
    await audit("ANALYSIS_RUN", {
      userId,
      metadata: { documentId: document.id, riskScore: result.riskScore, tokensUsed },
    });

    return NextResponse.json({ id: document.id, status: "ANALYZED" }, { status: 201 });
  } catch (err) {
    console.error("[analyze] failed", err);
    await prisma.document.update({
      where: { id: document.id },
      data: { status: "FAILED", errorMessage: "Analysis failed." },
    });
    await audit("ANALYSIS_FAILED", { userId, metadata: { documentId: document.id } });
    return NextResponse.json(
      { id: document.id, error: "Analysis failed. Please try again." },
      { status: 502 }
    );
  }
}
