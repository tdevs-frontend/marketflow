import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-text-secondary">{description}</p>
      {action}
    </div>
  );
}
