import { prisma } from "@/lib/db";

export type AuditAction =
  | "AUTH_REGISTER"
  | "AUTH_LOGIN"
  | "AUTH_LOGIN_FAILED"
  | "DOCUMENT_UPLOAD"
  | "DOCUMENT_DELETE"
  | "ANALYSIS_RUN"
  | "ANALYSIS_FAILED"
  | "BILLING_CHECKOUT"
  | "BILLING_PORTAL"
  | "BILLING_UPGRADE"
  | "BILLING_DOWNGRADE"
  | "RATE_LIMITED";

interface AuditOptions {
  userId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Persist a security/compliance audit event. Best-effort: logging failures
 * never block the originating request.
 */
export async function audit(action: AuditAction, opts: AuditOptions = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: opts.userId ?? null,
        metadata: (opts.metadata as object) ?? undefined,
        ipAddress: opts.ipAddress ?? null,
        userAgent: opts.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write log", action, err);
  }
}
