import Link from "next/link";
import { FileText, Gauge, Zap, ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUsageStatus } from "@/lib/usage";
import { getPlan } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/components/upload/upload-dropzone";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, name: true },
  });
  const plan = user?.plan ?? "FREE";
  const planConfig = getPlan(plan);
  const usage = await getUsageStatus(userId, plan);

  const recent = await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      filename: true,
      status: true,
      createdAt: true,
      analysis: { select: { riskLevel: true, riskScore: true } },
    },
  });

  const firstName = (user?.name || "there").split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {firstName}</h1>
        <p className="mt-1 text-muted-foreground">
          Upload a legal document to get a plain-English breakdown.
        </p>
      </div>

      {/* Usage stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Analyses this month</p>
              <p className="text-xl font-semibold">
                {usage.used} <span className="text-sm font-normal text-muted-foreground">/ {usage.limit}</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max document size</p>
              <p className="text-xl font-semibold">{planConfig.maxPages} pages</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <p className="text-xl font-semibold">{planConfig.name}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {usage.remaining <= 0 && plan === "FREE" && (
        <Card className="border-primary/40 bg-accent/40">
          <CardContent className="flex flex-col items-start justify-between gap-3 pt-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium">You&apos;ve used all your free analyses this month.</p>
              <p className="text-sm text-muted-foreground">Upgrade to Pro for 50 analyses and 100-page documents.</p>
            </div>
            <Link href="/billing">
              <Button>Upgrade to Pro <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle>New analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadDropzone remaining={usage.remaining} />
        </CardContent>
      </Card>

      {/* Recent */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent documents</h2>
          <Link href="/documents" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No documents yet. Upload your first one above.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {recent.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/documents/${doc.id}`}
                    className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
                      </div>
                    </div>
                    {doc.analysis ? (
                      <RiskBadge level={doc.analysis.riskLevel} />
                    ) : (
                      <span className="text-xs text-muted-foreground">{doc.status.toLowerCase()}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
