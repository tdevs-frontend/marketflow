import { ArrowRight, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

interface Signal {
  label: string;
  value: string;
  /** Movement in percentage points against yesterday. Omitted where there is
      no meaningful prior reading to compare against. */
  changePoints?: number;
}

/**
 * Placeholder figures — swap for `useGetPulseQuery()` once the API is live.
 *
 * Deliberately *today*, not the page's reporting period: these are the numbers
 * a merchant acts on this morning, and a conversion rate averaged over ninety
 * days answers a different question from the one this card is asking.
 */
const SIGNALS: Signal[] = [
  { label: "Conversion rate", value: "5.8%", changePoints: 0.7 },
  { label: "Lead response rate", value: "74%", changePoints: 8.2 },
  { label: "Automation success", value: "96.4%", changePoints: -0.3 },
];

interface Queue {
  label: string;
  value: number;
  href: string;
}

/* The two numbers on this card that are work rather than measurement, so both
   are links straight to the queue they describe. */
const QUEUES: Queue[] = [
  { label: "Unread WhatsApp", value: 12, href: APP_ROUTES.whatsappInbox },
  { label: "Pending orders", value: 8, href: APP_ROUTES.orders },
];

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

function Delta({ points }: { points: number }) {
  const positive = points >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 text-meta font-medium tabular-nums",
        positive ? "text-primary" : "text-error",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(points).toFixed(1)} pts
    </span>
  );
}

/**
 * The narrow half of the analytics row.
 *
 * Deliberately not a second chart. Growth Overview already answers "what is the
 * trend"; this answers "what is true right now and what needs me", which is the
 * reading a merchant opens the dashboard for and the one a curve is worst at
 * giving. Rates on top, work queues underneath, and the queues are links
 * because a count of unread messages is only useful next to a way to read them.
 */
export function BusinessPulse({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base">
            <span className="grid size-7 shrink-0 place-items-center rounded-btn bg-primary-soft text-primary">
              <Activity className="size-4" aria-hidden />
            </span>
            Business Pulse
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            A quick view of today&apos;s most important signals.
          </p>
        </div>

        <ButtonLink
          href={APP_ROUTES.analytics}
          variant="ghost"
          size="sm"
          className="shrink-0"
        >
          View Analytics
        </ButtonLink>
      </div>

      <dl className="mt-5 divide-y divide-border border-t border-border">
        {SIGNALS.map((signal) => (
          <div
            key={signal.label}
            className="flex items-center justify-between gap-3 py-3.5"
          >
            <dt className="min-w-0 truncate text-sm font-medium text-text-secondary">
              {signal.label}
            </dt>
            <dd className="flex shrink-0 items-baseline gap-2.5">
              <span className="text-xl leading-none font-bold text-text-primary tabular-nums">
                {signal.value}
              </span>
              {signal.changePoints === undefined ? null : (
                <Delta points={signal.changePoints} />
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {QUEUES.map((queue) => (
          <Link
            key={queue.label}
            href={queue.href}
            className="group rounded-panel bg-surface-secondary px-3.5 py-3 transition-colors hover:bg-primary-soft focus-visible:shadow-focus focus-visible:outline-none"
          >
            <p className="flex items-center justify-between gap-2 text-sm font-medium text-text-secondary">
              <span className="truncate">{queue.label}</span>
              <ArrowRight
                aria-hidden
                className="size-3.5 shrink-0 text-text-muted transition-colors group-hover:text-primary"
              />
            </p>
            <p className="mt-1.5 text-xl leading-none font-bold text-text-primary tabular-nums">
              {queue.value}
            </p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
