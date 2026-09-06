import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({
  className,
  interactive = false,
  children,
}: {
  className?: string;
  /** Adds the lift-on-hover treatment. Use it for cards that link somewhere. */
  interactive?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface shadow-card transition-all",
        interactive && "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? <p className="text-xs text-text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
