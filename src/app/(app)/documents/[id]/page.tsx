import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AnalysisResultSchema } from "@/types/analysis";
import { AnalysisView } from "@/components/analysis/analysis-view";
import { DocumentActions } from "@/components/analysis/document-actions";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatBytes } from "@/lib/utils";

export const metadata = { title: "Analysis" };

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const document = await prisma.document.findUnique({
    where: { id },
    include: { analysis: true },
  });

  if (
    !document ||
    (document.userId !== session!.user.id && session!.user.role !== "ADMIN")
  ) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/documents"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to documents
          </Link>
          <h1 className="truncate text-2xl font-bold tracking-tight">{document.filename}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(document.createdAt)} · {document.pageCount} pages · {formatBytes(document.fileSize)}
          </p>
        </div>
        <DocumentActions documentId={document.id} />
      </div>

      {document.status === "FAILED" && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center gap-3 pt-6 text-sm">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>
              {document.errorMessage || "Analysis failed."} You can delete this document and try again.
            </span>
          </CardContent>
        </Card>
      )}

      {document.status === "PROCESSING" && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Analysis in progress…
          </CardContent>
        </Card>
      )}

      {document.analysis &&
        (() => {
          const parsed = AnalysisResultSchema.safeParse(document.analysis!.result);
          if (!parsed.success) {
            return (
              <Card className="border-destructive/40">
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  This analysis is in an unexpected format and can&apos;t be displayed.
                </CardContent>
              </Card>
            );
          }
          return (
            <AnalysisView
              result={parsed.data}
              originalText={document.extractedText}
            />
          );
        })()}
    </div>
  );
}
