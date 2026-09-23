import {
  CreditCard,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Package,
  Plug,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { NotificationModule, NotificationTone } from "@/types/notification";

/**
 * The tile at the left of every notification, wherever one is rendered.
 *
 * One component for the bell and the archive page, because the icon is the only
 * thing a reader uses to triage a feed *before* reading it - and a feed where
 * an order is a cart in the dropdown and a bag on the page has no triage value
 * at all. The vocabulary lives here and nowhere else.
 *
 * Two axes, deliberately not mixed:
 *
 *   The **icon** says where the event came from. Orders is a cart whether the
 *   order arrived or its payment was declined.
 *
 *   The **colour** says how much to care. Three tones, and only one is warm:
 *   `alert` is the sole state that changes what somebody does next, so it is
 *   the only one on the error ramp. A palette a reader has to learn is a
 *   palette they ignore.
 */

const MODULE_ICON: Record<NotificationModule, LucideIcon> = {
  order: ShoppingCart,
  inventory: Package,
  customer: Users,
  marketing: Megaphone,
  whatsapp: MessageCircle,
  email: Mail,
  sms: MessageSquare,
  social: Share2,
  automation: Workflow,
  integration: Plug,
  workspace: Users,
  billing: CreditCard,
  security: ShieldCheck,
};

const TONES: Record<NotificationTone, string> = {
  info: "bg-surface-secondary text-text-secondary",
  success: "bg-success-soft text-success-text",
  alert: "bg-error-soft text-error-text",
};

export function NotificationIcon({
  module,
  tone,
  className,
}: {
  module: NotificationModule;
  tone: NotificationTone;
  className?: string;
}) {
  const Icon = MODULE_ICON[module];

  return (
    <span
      aria-hidden
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-btn",
        TONES[tone],
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}
