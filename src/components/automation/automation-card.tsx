import Link from "next/link";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatNumber, formatPercent, rate } from "@/lib/format";
import type { Automation, AutomationStatus } from "@/types/automation";

const TONES: Record<AutomationStatus, BadgeTone> = {
  draft: "neutral",
  active: "success",
  paused: "warning",
  archived: "neutral",
};

export function AutomationCard({ automation }: { automation: Automation }) {
  const { entered, completed, active } = automation.stats;

  return (
    <Card className="p-5" interactive>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            href={`/dashboard/automation/${automation.id}`}
            className="text-sm font-semibold text-text-primary transition-colors hover:text-primary"
          >
            {automation.name}
          </Link>
          {automation.description ? (
            <p className="text-xs text-text-muted">
              {automation.description}
            </p>
          ) : null}
        </div>
        <Badge tone={TONES[automation.status]}>{automation.status}</Badge>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-text-muted">Entered</dt>
          <dd className="font-semibold text-text-primary">{formatNumber(entered)}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">In flow</dt>
          <dd className="font-semibold text-text-primary">{formatNumber(active)}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Completion</dt>
          <dd className="font-semibold text-text-primary">{formatPercent(rate(completed, entered))}</dd>
        </div>
      </dl>
    </Card>
  );
}
