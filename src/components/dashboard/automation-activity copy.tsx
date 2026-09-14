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

import { Badge, type BadgeTone } from "@/components/ui/badge";
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
 * they read differently from the four settled ones — a merchant scanning this
 * card is looking for the row that needs them, and that is either a failure or
 * something that has not finished.
 */
type RunStatus =
  | "Completed"
  | "Sent"
  | "Running"
  | "Queued"
  | "Skipped"
  | "Failed";

const STATUS_TONE: Record<RunStatus, BadgeTone> = {
  Completed: "success",
  Sent: "success",
  Running: "info",
  Queued: "warning",
  Skipped: "neutral",
  Failed: "danger",
};

interface ActivityItem {
  title: string;
  detail: string;
  time: string;
  status: RunStatus;
  icon: LucideIcon;
  tone: string;
}

/* One customer's whole journey, in order — the lifecycle the rest of the
   dashboard measures, shown happening — and then the batch work running
   alongside it, including the one send that did not land. */
const ACTIVITY: ActivityItem[] = [
  {
    title: "New lead captured",
    detail: "Sarah Ahmed entered “Lead Nurture”",
    time: "2 min ago",
    status: "Completed",
    icon: UserPlus,
    tone: "bg-primary-soft text-primary",
  },
  {
    title: "WhatsApp message sent",
    detail: "Welcome Flow → 24 contacts",
    time: "8 min ago",
    status: "Sent",
    icon: MessageCircle,
    tone: "bg-whatsapp-soft text-whatsapp",
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
    detail: "Order #MF-10248 → Premium Package",
    time: "15 min ago",
    status: "Completed",
    icon: CheckCircle2,
    tone: "bg-success-soft text-success-text",
  },
  {
    title: "Follow-up sent",
    detail: "Post Purchase Flow → Customer",
    time: "21 min ago",
    status: "Sent",
    icon: Send,
    tone: "bg-gray text-gray-ink",
  },
  {
    title: "Cart recovery started",
    detail: "Abandoned Cart Flow → 18 contacts",
    time: "34 min ago",
    status: "Running",
    icon: ShoppingCart,
    tone: "bg-info-soft text-info-text",
  },
  {
    title: "Discount code issued",
    detail: "“WELCOME10” → John Smith",
    time: "47 min ago",
    status: "Completed",
    icon: Tag,
    tone: "bg-primary-soft text-primary",
  },
  {
    title: "Email delivery failed",
    detail: "Re-engagement Flow → 3 contacts bounced",
    time: "1 hr ago",
    status: "Failed",
    icon: AlertTriangle,
    tone: "bg-error-soft text-error-text",
  },
];

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

export function AutomationActivity({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base">Automation Activity</h2>
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
        /* One line per event from `sm` up. The card is half the grid now, so
           the title column gives width back to the detail until `2xl`. */
        <ol className="mt-5 flex-1">
          {ACTIVITY.map((item, index) => {
            const ItemIcon = item.icon;
            const last = index === ACTIVITY.length - 1;

            return (
              <li
                key={item.title}
                className="relative flex gap-3.5 pb-4 last:pb-0"
              >
                {/* The rail stops at the last marker rather than trailing past it. */}
                {last ? null : (
                  <span
                    aria-hidden
                    className="absolute top-9 bottom-0 left-4.25 w-px bg-border"
                  />
                )}

                <span
                  className={cn(
                    "grid size-8.5 shrink-0 place-items-center rounded-full",
                    item.tone,
                  )}
                >
                  <ItemIcon className="size-4" aria-hidden />
                </span>

                <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-1.5 pt-1.5 sm:flex-row sm:items-center">
                  <p className="truncate text-sm font-medium text-text-primary sm:w-36 sm:shrink-0 2xl:w-44">
                    {item.title}
                  </p>
                  <p className="min-w-0 flex-1 truncate text-sm text-text-secondary">
                    {item.detail}
                  </p>

                  {/* Status and time travel together: the badge says how the run
                      ended, the timestamp says when — read apart, neither is
                      much use. */}
                  <div className="flex shrink-0 items-center gap-2.5">
                    <Badge
                      tone={STATUS_TONE[item.status]}
                      size="sm"
                      className="normal-case"
                    >
                      {item.status}
                    </Badge>
                    <span className="text-meta text-text-secondary">
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
