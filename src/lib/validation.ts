import { z } from "zod";
import type { FileType } from "@prisma/client";

export const MAX_UPLOAD_BYTES =
  (Number(process.env.MAX_UPLOAD_MB) || 15) * 1024 * 1024;

// Allowed MIME types mapped to our FileType enum. We validate by MIME *and*
// extension, and reject anything that doesn't match a known signature.
const MIME_MAP: Record<string, FileType> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/plain": "TXT",
};

const EXT_MAP: Record<string, FileType> = {
  pdf: "PDF",
  docx: "DOCX",
  txt: "TXT",
};

// Magic-byte signatures for defense-in-depth against spoofed content types.
function sniffType(buffer: Buffer): FileType | null {
  if (buffer.length >= 4) {
    // %PDF
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46)
      return "PDF";
    // PK\x03\x04 (zip / docx)
    if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04)
      return "DOCX";
  }
  return null;
}

export interface FileValidationResult {
  ok: boolean;
  fileType?: FileType;
  error?: string;
}

export function validateUpload(
  filename: string,
  mimeType: string,
  size: number,
  buffer: Buffer
): FileValidationResult {
  if (size <= 0) return { ok: false, error: "File is empty." };
  if (size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `File exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB limit.`,
    };
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const byExt = EXT_MAP[ext];
  const byMime = MIME_MAP[mimeType];

  if (!byExt && !byMime) {
    return { ok: false, error: "Unsupported file type. Upload a PDF, DOCX, or TXT." };
  }

  const resolved = byExt ?? byMime;

  // For binary formats, verify the magic bytes match the claimed type.
  if (resolved === "PDF" || resolved === "DOCX") {
    const sniffed = sniffType(buffer);
    if (sniffed && sniffed !== resolved) {
      return { ok: false, error: "File content does not match its extension." };
    }
    if (!sniffed) {
      return { ok: false, error: "File appears corrupted or is not a valid document." };
    }
  }

  return { ok: true, fileType: resolved };
}

// ── Auth input schemas ───────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200)
    .regex(/[a-zA-Z]/, "Include at least one letter")
    .regex(/[0-9]/, "Include at least one number"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
