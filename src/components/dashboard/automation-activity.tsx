import {
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  Package,
  Send,
  ShoppingCart,
  Tag,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * What the run did, not what the workflow is.
 *
 * `Running` and `Queued` are the two states that are still moving, which is why
 * they read differently from the four settled ones - a merchant scanning this
 * card is looking for the row that needs them, and that is either a failure or
 * something that has not finished.
 */
type RunStatus = "Completed" | "Sent" | "Running" | "Queued" | "Skipped" | "Failed";

const STATUS_TONE: Record<RunStatus, BadgeVariant> = {
  Completed: "success",
  Sent: "success",
  Running: "info",
  Queued: "warning",
  Skipped: "default",
  Failed: "error",
};

/** The states that are still moving get the live mark. */
const IN_FLIGHT: ReadonlySet<RunStatus> = new Set<RunStatus>(["Running", "Queued"]);

interface ActivityItem {
  title: string;
  /** The workflow the run belongs to, where the event came from a named one. */
  workflow?: string;
  detail: string;
  time: string;
  status: RunStatus;
  icon: LucideIcon;
  tone: string;
}

/* One customer's whole journey, in order - the lifecycle the rest of the
   dashboard measures, shown happening - and then the batch work running
   alongside it, including the one send that did not land. */
const ACTIVITY: ActivityItem[] = [
  {
    title: "New lead captured",
    workflow: "Lead Nurture",
    detail: "Sarah Ahmed entered the flow",
    time: "2 min ago",
    status: "Completed",
    icon: UserPlus,
    tone: "bg-primary-soft text-primary",
  },
  {
    title: "WhatsApp message sent",
    workflow: "Welcome Flow",
    detail: "Delivered to 24 contacts",
    time: "8 min ago",
    status: "Sent",
    icon: MessageCircle,
    tone: "bg-whatsapp-soft text-whatsapp-dark",
  },
  {
    title: "Product inquiry received",
    detail: "Sarah asked about Premium Package",
    time: "12 min ago",
    status: "Completed",
    icon: Package,
    tone: "bg-info-soft text-info-text",
  },
  {
    title: "Order completed",
    detail: "Order #MF-10248 · Premium Package",
    time: "15 min ago",
    status: "Completed",
    icon: CheckCircle2,
    tone: "bg-success-soft text-success-text",
  },
  {
    title: "Follow-up sent",
    workflow: "Post Purchase Flow",
    detail: "Delivered to the customer",
    time: "21 min ago",
    status: "Sent",
    icon: Send,
    tone: "bg-gray text-gray-ink",
  },
  {
    title: "Cart recovery started",
    workflow: "Abandoned Cart Flow",
    detail: "Reaching 18 contacts",
    time: "34 min ago",
    status: "Running",
    icon: ShoppingCart,
    tone: "bg-info-soft text-info-text",
  },
  {
    title: "Discount code issued",
    workflow: "Welcome Flow",
    detail: "“WELCOME10” to John Smith",
    time: "47 min ago",
    status: "Completed",
    icon: Tag,
    tone: "bg-primary-soft text-primary",
  },
  {
    title: "Email delivery failed",
    workflow: "Re-engagement Flow",
    detail: "3 contacts bounced",
    time: "1 hr ago",
    status: "Failed",
    icon: AlertTriangle,
    tone: "bg-error-soft text-error-text",
  },
];

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * What the workflows have been doing, as a run log.
 *
 * It sits beside the orders table, and the two used to read as one component
 * rendered twice: both were a row of single-line columns with a badge and a
 * timestamp on the right. This one is not tabular, because its rows are not
 * comparable the way two amounts are - each entry is an event, and an event
 * wants a headline and a sentence under it rather than a cell in a grid.
 *
 * So: a rail down the icons for chronology, two lines of copy per run, and
 * status stacked over time at the right edge. Nothing lines up into columns,
 * which is the point - a glance should place this as a feed before any of the
 * words are read.
 */
export function AutomationActivity({ className }: { className?: string }) {
  return (
    <Card className={cn("flex min-w-0 flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg">Automation Activity</h2>
          <p className="mt-1 text-sm text-text-secondary font-medium">
            What your workflows have done recently.
          </p>
        </div>

        <ButtonLink
          href={AUTOMATION_ROUTES.workflows}
          variant="ghost"
          size="sm"
          className="shrink-0"
        >
          View Workflows
        </ButtonLink>
      </div>

      {ACTIVITY.length === 0 ? (
        <div className="mt-5 flex-1">
          <EmptyState
            compact
            title="No automations running"
            description="Build a workflow and every step it takes will be logged here."
            action={
              <ButtonLink href={AUTOMATION_ROUTES.create} size="sm">
                Create Workflow
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <ol className="mt-5 flex-1">
          {ACTIVITY.map((item, index) => {
            const ItemIcon = item.icon;
            const last = index === ACTIVITY.length - 1;

            return (
              <li
                key={item.title}
                className="relative flex gap-3.5 pb-5 last:pb-0"
              >
                {/* The rail stops at the last marker rather than trailing past
                    it. `left-4.5` is the centre of a 36px marker. */}
                {last ? null : (
                  <span
                    aria-hidden
                    className="absolute top-10 bottom-0 left-4.5 w-px bg-border"
                  />
                )}

                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full",
                    item.tone,
                  )}
                >
                  <ItemIcon className="size-4.5" aria-hidden />
                </span>

                {/* Two columns from `sm` up. On a phone there is no room for a
                    second column, so status and time drop under the
                    description rather than off the edge of the card. */}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-text-primary">
                      {item.title}
                    </p>

                    {/* The workflow leads the description where there is one:
                        the run is only legible once you know which flow
                        produced it, and that is the fact the rest of the
                        sentence hangs off. */}
                    <p className="mt-0.5 truncate text-sm text-text-muted">
                      {item.workflow ? (
                        <>
                          <span className="text-text-secondary">
                            {item.workflow}
                          </span>
                          <span aria-hidden> · </span>
                        </>
                      ) : null}
                      {item.detail}
                    </p>
                  </div>

                  {/* Status over time, right-aligned: the badge says how the run
                      ended, the timestamp says when - read apart, neither is
                      much use. Stacking them keeps the pair off the
                      description's line, so the copy gets the full measure. */}
                  <div className="flex shrink-0 items-center gap-2.5 sm:flex-col sm:items-end sm:gap-1">
                    <Badge
                      variant={STATUS_TONE[item.status]}
                      size="sm"
                      casing="none"
                      className="gap-1.5"
                    >
                      {/* `bg-current` takes the badge's own ink, so the mark
                          never introduces a colour the tone does not already
                          carry. It pulses only while the run is still moving. */}
                      <span
                        aria-hidden
                        className={cn(
                          "size-1.5 rounded-full bg-current",
                          IN_FLIGHT.has(item.status) &&
                            "animate-pulse motion-reduce:animate-none",
                        )}
                      />
                      {item.status}
                    </Badge>
                    <span className="text-sm font-medium text-text-muted">
                      {item.time}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
