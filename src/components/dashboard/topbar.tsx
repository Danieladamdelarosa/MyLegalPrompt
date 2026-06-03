"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Plan } from "@prisma/client";

export function Topbar({
  name,
  email,
  plan,
}: {
  name?: string | null;
  email?: string | null;
  plan: Plan;
}) {
  const initial = (name || email || "?").charAt(0).toUpperCase();
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2">
        <Badge className={plan === "PRO" ? "border-primary text-primary" : ""}>
          {plan === "PRO" ? "Pro" : "Free"} plan
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initial}
          </span>
          <span className="hidden max-w-[140px] truncate text-sm sm:block">
            {name || email}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
