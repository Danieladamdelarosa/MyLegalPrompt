import Link from "next/link";
import { FileText, Upload } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatBytes } from "@/lib/utils";

export const metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const session = await auth();
  const documents = await prisma.document.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      fileType: true,
      fileSize: true,
      pageCount: true,
      status: true,
      createdAt: true,
      analysis: { select: { riskLevel: true, riskScore: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="mt-1 text-muted-foreground">Your analysis history.</p>
        </div>
        <Link href="/dashboard">
          <Button>
            <Upload className="h-4 w-4" /> New analysis
          </Button>
        </Link>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <FileText className="h-6 w-6" />
            </div>
            <p className="mt-4 font-medium">No documents yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a contract to get started.
            </p>
            <Link href="/dashboard" className="mt-6 inline-block">
              <Button>Upload a document</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {documents.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(doc.createdAt)} · {doc.pageCount} pages · {formatBytes(doc.fileSize)}
                      </p>
                    </div>
                  </div>
                  {doc.analysis ? (
                    <div className="flex items-center gap-3">
                      <span className="hidden text-sm font-semibold sm:block">
                        {doc.analysis.riskScore}/100
                      </span>
                      <RiskBadge level={doc.analysis.riskLevel} />
                    </div>
                  ) : (
                    <span className="text-xs capitalize text-muted-foreground">
                      {doc.status.toLowerCase()}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
