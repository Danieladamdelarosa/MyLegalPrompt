import mammoth from "mammoth";
import type { FileType } from "@prisma/client";

export interface ParsedFile {
  text: string;
  pageCount: number;
}

const WORDS_PER_PAGE = 500;

/** Estimate page count for formats without explicit pagination (DOCX, TXT). */
function estimatePages(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_PAGE));
}

/**
 * Extract plain text and a page count from an uploaded document buffer.
 * `pdf-parse` is imported dynamically because it reads files at module load
 * time, which breaks Next.js server bundling when imported statically.
 */
export async function parseFile(
  buffer: Buffer,
  fileType: FileType
): Promise<ParsedFile> {
  switch (fileType) {
    case "PDF": {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return {
        text: data.text ?? "",
        pageCount: data.numpages || estimatePages(data.text ?? ""),
      };
    }
    case "DOCX": {
      const { value } = await mammoth.extractRawText({ buffer });
      return { text: value ?? "", pageCount: estimatePages(value ?? "") };
    }
    case "TXT": {
      const text = buffer.toString("utf-8");
      return { text, pageCount: estimatePages(text) };
    }
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
