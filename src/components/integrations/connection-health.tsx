"use client";

import type { ReactNode } from "react";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import { INTEGRATIONS_NOW_MS } from "@/lib/integration-fixtures";
import { cn } from "@/lib/utils";
import type { HealthCheck } from "@/types/integration";
import { HealthBadge, HealthDot } from "./integration-badges";

/**
 * The health panel, shared by every integration detail page.
 *
 * One row per check: what was tested, what the answer was, when it was last
 * asked, and — on a failing check only — the button that fixes it. The `detail`
 * line is the part that earns the panel its place; "Webhook: Error" tells a
 * merchant nothing they can act on, and "Meta stopped accepting the callback
 * URL" tells them where to go.
 *
 * Checks are rendered in the order given rather than sorted by severity: the
 * order is the pipeline (can we reach the API → is the webhook arriving → is
 * the queue draining), and reading it top to bottom is how a merchant works out
 * which failure is the cause and which is the symptom.
 */
export function ConnectionHealth({
  checks,
  onFix,
  action,
  className,
}: {
  checks: HealthCheck[];
  /** Called with the check that needs attention. Wire it to the real repair. */
  onFix?: (check: HealthCheck) => void;
  /** A header action — usually "Run checks". */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader title="Connection Health" action={action} />
      <CardBody className="space-y-1 p-2">
        {checks.map((check) => (
          <div
            key={check.id}
            className={cn(
              "flex flex-wrap items-start gap-x-3 gap-y-2 rounded-panel px-3 py-2.5 transition-colors",
              check.status !== "healthy" && "bg-surface-secondary",
            )}
          >
            <HealthDot status={check.status} className="mt-1.5" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">{check.label}</p>
              <p className="mt-0.5 text-sm text-text-secondary">{check.detail}</p>
              <p className="mt-1 text-meta text-text-muted">
                Checked {formatRelativeTime(check.checkedAt, INTEGRATIONS_NOW_MS)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {check.fixLabel && onFix ? (
                <Button variant="outline" size="sm" onClick={() => onFix(check)}>
                  {check.fixLabel}
                </Button>
              ) : null}
              <HealthBadge status={check.status} size="sm" />
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
