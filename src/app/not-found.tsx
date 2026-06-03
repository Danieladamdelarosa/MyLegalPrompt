import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-8" />
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have
        access to it.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/">
          <Button variant="outline">Go home</Button>
        </Link>
        <Link href="/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
