"use client";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import type { BadgeTone } from "@/components/ui/badge";
import type { SubscriptionStatus } from "@/types/account";

/**
 * The two things every panel in the billing module needs and none of them owns.
 *
 * Both are here for the same reason: a status badge that is amber on one tab
 * and grey on the next, or a disabled control that explains itself on one
 * screen and simply greys out on another, is how a module stops reading as one
 * module.
 */

/** Subscription status → its label and the product's tone for it. */
export const STATUS: Record<
  SubscriptionStatus,
  { label: string; tone: BadgeTone }
> = {
  active: { label: "Active", tone: "success" },
  trialing: { label: "Trial", tone: "info" },
  past_due: { label: "Past due", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

/**
 * A button that is off, with the reason attached.
 *
 * The tooltip is on a wrapper because a disabled button fires no pointer
 * events of its own, which is the detail that turns "greyed out for no reason"
 * into an explanation. Hiding the control instead would send a merchant
 * hunting for where cancellation lives; wiring it to a toast would claim
 * something happened.
 */
export function UnavailableAction({
  reason,
  children,
}: {
  reason: string;
  children: string;
}) {
  return (
    <Tooltip content={reason}>
      <span className="inline-flex">
        {/* Always `outline`. It is the one variant whose disabled state the
            design system actually draws — a muted label inside a firm border.
            `ghost` keeps `text-primary` when disabled, so at 50% opacity it
            reads as a link somebody has not tried clicking yet. */}
        <Button variant="outline" size="compact" disabled>
          {children}
        </Button>
      </span>
    </Tooltip>
  );
}
