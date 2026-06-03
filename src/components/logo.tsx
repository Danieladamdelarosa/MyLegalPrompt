import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  withText = true,
}: {
  className?: string;
  withText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Scale className="h-5 w-5" />
      </span>
      {withText && (
        <span className="text-lg tracking-tight">
          MyLegal<span className="text-primary">Prompt</span>
        </span>
      )}
    </span>
  );
}
