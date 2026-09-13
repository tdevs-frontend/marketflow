import {
  Bell,
  CalendarClock,
  CalendarDays,
  CircleStop,
  Clock,
  Code,
  GitBranch,
  Layers,
  Layers3,
  Mail,
  Megaphone,
  MessageCircle,
  Network,
  PencilLine,
  Percent,
  ShoppingCart,
  Smartphone,
  Split,
  Tag,
  Tags,
  Target,
  UserCog,
  Users,
  Webhook,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { NODE_CATEGORY, NODE_META } from "@/constants/automation";
import { cn } from "@/lib/utils";
import type { NodeKind } from "@/types/workflow";

/**
 * Resolves the icon keys in `constants/automation` to components.
 *
 * A registry rather than dynamic imports: the keys are a closed set written in
 * this repo, and `lucide-react`'s barrel is tree-shaken by what is named here.
 * Mirrors how `components/ui/icon` resolves the navigation keys.
 */
const ICONS: Record<string, LucideIcon> = {
  Bell,
  CalendarClock,
  CalendarDays,
  CircleStop,
  Clock,
  Code,
  GitBranch,
  Layers,
  Layers3,
  Mail,
  Megaphone,
  MessageCircle,
  Network,
  PencilLine,
  Percent,
  ShoppingCart,
  Smartphone,
  Split,
  Tag,
  Tags,
  Target,
  UserCog,
  Users,
  Webhook,
  Zap,
};

/**
 * The icon for a key, as a plain lookup.
 *
 * Indexed rather than called at the point of use: a capitalised binding
 * assigned from a *function call* and then rendered reads as creating a
 * component during render, which the compiler rejects. A property access does
 * not, and the two are the same thing.
 */
export const ICON_FOR: Record<string, LucideIcon> = ICONS;

/** The channel marks, so a chip can index them instead of calling a resolver. */
export const CHANNEL_ICON: Record<string, LucideIcon> = {
  whatsapp: MessageCircle,
  email: Mail,
  sms: Smartphone,
};

/**
 * A node's icon in its category tile.
 *
 * The tile is the *only* colour a node carries — the card itself stays on the
 * product's own surface. Category is also stated in words on the node, so the
 * tint is reinforcement rather than the sole signal.
 */
export function NodeIcon({
  kind,
  size = "md",
  className,
}: {
  kind: NodeKind;
  size?: "sm" | "md";
  className?: string;
}) {
  const meta = NODE_META[kind];
  const theme = NODE_CATEGORY[meta?.category ?? "advanced"];
  const Icon = ICONS[meta?.icon ?? "Zap"] ?? Zap;

  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-btn",
        size === "sm" ? "size-6" : "size-8",
        theme.tile,
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-4"} />
    </span>
  );
}
