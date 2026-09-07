import {
  CheckCircle2,
  MessageCircle,
  Package,
  Send,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

interface ActivityItem {
  title: string;
  detail: string;
  time: string;
  icon: LucideIcon;
  tone: string;
}

/**
 * Read top to bottom this is one customer's whole journey — Sarah is captured,
 * messaged, asks about a product, orders it, and gets a post-purchase
 * follow-up. That is the lifecycle the rest of the dashboard measures, shown
 * happening.
 */
const ACTIVITY: ActivityItem[] = [
  {
    title: "New lead captured",
    detail: "Sarah Ahmed entered “Lead Nurture”",
    time: "2 min ago",
    icon: UserPlus,
    tone: "bg-primary-soft text-primary",
  },
  {
    title: "WhatsApp message sent",
    detail: "Welcome Flow → 24 contacts",
    time: "8 min ago",
    icon: MessageCircle,
    tone: "bg-primary-soft text-primary",
  },
  {
    title: "Product inquiry received",
    detail: "Sarah asked about Premium Package",
    time: "12 min ago",
    icon: Package,
    tone: "bg-info-soft text-info-text",
  },
  {
    title: "Order completed",
    detail: "Order #MF-10248 → Premium Package",
    time: "15 min ago",
    icon: CheckCircle2,
    tone: "bg-success-soft text-success-text",
  },
  {
    title: "Follow-up sent",
    detail: "Post Purchase Flow → Customer",
    time: "21 min ago",
    icon: Send,
    tone: "bg-gray text-gray-ink",
  },
];

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

export function AutomationActivity({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base">Automation Activity</h2>
          <p className="mt-1 text-sm text-text-secondary">
            What your workflows have done in the last hour.
          </p>
        </div>

        <ButtonLink
          href={APP_ROUTES.automation}
          variant="ghost"
          size="sm"
          className="shrink-0"
        >
          View Workflows
        </ButtonLink>
      </div>

      {/*
       * One line per event at `sm` and up. In a two-column card a stacked
       * timeline would run five items well past the height of the funnel
       * beside it; aligning title, detail and time into columns keeps the card
       * short and makes the sequence scannable.
       */}
      <ol className="mt-4">
        {ACTIVITY.map((item, index) => {
          const ItemIcon = item.icon;
          const last = index === ACTIVITY.length - 1;

          return (
            <li key={item.title} className="relative flex gap-3.5 pb-4 last:pb-0">
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

              <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-0.5 pt-1.5 sm:flex-row sm:items-baseline">
                <p className="text-sm font-medium text-text-primary sm:w-52 sm:shrink-0">
                  {item.title}
                </p>
                <p className="min-w-0 flex-1 truncate text-[13px] text-text-secondary">
                  {item.detail}
                </p>
                <span className="shrink-0 text-[11px] text-text-muted">
                  {item.time}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
