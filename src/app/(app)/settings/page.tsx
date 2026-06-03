import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlan } from "@/lib/plans";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { name: true, email: true, plan: true, createdAt: true, role: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Your account details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border text-sm">
          <Row label="Name" value={user?.name || "—"} />
          <Row label="Email" value={user?.email || "—"} />
          <Row label="Plan" value={getPlan(user?.plan ?? "FREE").name} />
          {user?.role === "ADMIN" && <Row label="Role" value="Administrator" />}
          <Row label="Member since" value={user ? formatDate(user.createdAt) : "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data &amp; privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Uploaded documents and analyses are private to your account. Delete
            any document from its analysis page to remove the original file and
            its results permanently.
          </p>
          <p>
            MyLegalPrompt provides informational summaries, not legal advice.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
