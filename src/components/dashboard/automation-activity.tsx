import {
  MessageCircle,
  UserCheck,
  UserPlus,
  CheckCircle2,
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
    title: "Follow-up completed",
    detail: "Product Inquiry Flow",
    time: "15 min ago",
    icon: CheckCircle2,
    tone: "bg-success-soft text-success-text",
  },
  {
    title: "Lead assigned",
    detail: "John Smith → Sales Team",
    time: "21 min ago",
    icon: UserCheck,
    tone: "bg-surface-secondary text-text-secondary",
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

      <ol className="mt-5">
        {ACTIVITY.map((item, index) => {
          const ItemIcon = item.icon;
          const last = index === ACTIVITY.length - 1;

          return (
            <li key={item.title} className="relative flex gap-3.5 pb-5 last:pb-0">
              {/* The rail stops at the last marker rather than trailing past it. */}
              {last ? null : (
                <span
                  aria-hidden
                  className="absolute top-9 bottom-1 left-[1.0625rem] w-px bg-border"
                />
              )}

              <span
                className={cn(
                  "relative grid size-[2.125rem] shrink-0 place-items-center rounded-full",
                  item.tone,
                )}
              >
                <ItemIcon className="size-4" aria-hidden />
              </span>

              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="text-sm font-medium text-text-primary">{item.title}</p>
                  <span className="shrink-0 text-[11px] text-text-muted">
                    {item.time}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[13px] text-text-secondary">
                  {item.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
