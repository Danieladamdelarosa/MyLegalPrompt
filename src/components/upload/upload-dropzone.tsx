"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, Loader2, X, AlertCircle } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ACCEPT = ".pdf,.docx,.txt";
const MAX_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 15;
const ALLOWED_EXT = ["pdf", "docx", "txt"];

type Phase = "idle" | "uploading" | "analyzing" | "error";

export function UploadDropzone({ remaining }: { remaining: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const outOfCredits = remaining <= 0;

  const validate = (f: File): string | null => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) return "Unsupported file. Upload a PDF, DOCX, or TXT.";
    if (f.size > MAX_MB * 1024 * 1024) return `File exceeds the ${MAX_MB}MB limit.`;
    if (f.size === 0) return "That file is empty.";
    return null;
  };

  const selectFile = (f: File) => {
    const err = validate(f);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) selectFile(f);
  }, []);

  const upload = async () => {
    if (!file) return;
    setPhase("uploading");
    setProgress(0);
    setError(null);

    const body = new FormData();
    body.append("file", file);

    try {
      const id = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/documents");
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setProgress(pct);
            if (pct >= 100) setPhase("analyzing");
          }
        };
        xhr.onload = () => {
          let data: { id?: string; error?: string } = {};
          try {
            data = JSON.parse(xhr.responseText);
          } catch {
            /* ignore */
          }
          if (xhr.status >= 200 && xhr.status < 300 && data.id) resolve(data.id);
          else reject(new Error(data.error || "Upload failed."));
        };
        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.send(body);
      });

      router.push(`/documents/${id}`);
      router.refresh();
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const busy = phase === "uploading" || phase === "analyzing";

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={outOfCredits}
        onClick={() => !busy && !outOfCredits && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !busy && !outOfCredits && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!outOfCredits) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => !outOfCredits && onDrop(e)}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card px-6 py-12 text-center transition-colors",
          dragging && "border-primary bg-accent",
          (busy || outOfCredits) && "cursor-not-allowed opacity-60"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={busy || outOfCredits}
          onChange={(e) => e.target.files?.[0] && selectFile(e.target.files[0])}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <UploadCloud className="h-7 w-7" />
        </div>
        <p className="mt-4 font-medium">
          {outOfCredits
            ? "You're out of analyses this month"
            : "Drag & drop a document, or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF, DOCX, or TXT · up to {MAX_MB}MB
        </p>
      </div>

      {file && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
          </div>
          {!busy && (
            <button
              aria-label="Remove file"
              onClick={() => {
                setFile(null);
                setError(null);
              }}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {busy && (
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${phase === "analyzing" ? 100 : progress}%` }}
            />
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {phase === "uploading"
              ? `Uploading… ${progress}%`
              : "Analyzing with AI — this can take up to a minute…"}
          </p>
        </div>
      )}

      {error && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      <Button
        onClick={upload}
        disabled={!file || busy || outOfCredits}
        className="w-full"
        size="lg"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Analyze document
      </Button>
    </div>
  );
}
