"use client";

import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AUTOMATION_ROUTES } from "@/constants/automation";

/**
 * The failure state for anything in Automation that loads.
 *
 * One component rather than a message per call site, so a failed template load
 * and a failed publish look like the same product. `onRetry` is the primary
 * action wherever retrying is possible — most failures here are a request that
 * timed out, and trying again is both the likely fix and the cheapest thing to
 * do. The copy never surfaces `error.message`: that string comes from the
 * server and can carry internals, so the detail stays in the digest, which is
 * the only thing support can correlate against a log.
 */
export function AutomationErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Retry",
  digest,
  secondary,
  className,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  digest?: string;
  /** An escape route when retrying is not the answer — usually a way back. */
  secondary?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className ?? "mx-auto max-w-lg p-8 text-center"}>
      <span className="mx-auto grid size-11 place-items-center rounded-panel bg-error-soft text-error">
        <AlertTriangle className="size-5" aria-hidden />
      </span>

      <h2 className="mt-4 text-lg">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">
        {description}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        {onRetry ? (
          <Button size="compact" onClick={onRetry}>
            <RefreshCw aria-hidden />
            {retryLabel}
          </Button>
        ) : null}
        {secondary ?? (
          <ButtonLink
            href={AUTOMATION_ROUTES.workflows}
            variant="outline"
            size="compact"
          >
            Back to Workflows
          </ButtonLink>
        )}
      </div>

      {digest ? (
        <p className="mt-5 border-t border-border pt-4 text-sm text-text-muted">
          Reference{" "}
          <code className="font-mono text-text-secondary">{digest}</code> — quote
          this if you contact support.
        </p>
      ) : null}
    </Card>
  );
}

/**
 * The inline version, for a panel inside a page that otherwise loaded — a
 * chart that failed while the page around it is fine.
 */
export function InlineErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-error/40 bg-error-soft/40 px-6 py-8 text-center"
    >
      <AlertTriangle className="size-5 text-error" aria-hidden />
      <p className="max-w-sm text-sm text-text-secondary">{message}</p>
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
