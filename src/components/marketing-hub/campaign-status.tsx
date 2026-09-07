import { Mail, MessageCircle, Smartphone } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CampaignStatus, MarketingChannel } from "@/types/marketing";

const STATUS_TONES: Record<CampaignStatus, BadgeTone> = {
  draft: "neutral",
  scheduled: "info",
  running: "success",
  completed: "brand",
  paused: "warning",
  failed: "danger",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{status}</Badge>;
}

const CHANNEL_META: Record<
  MarketingChannel,
  { label: string; icon: typeof Mail; className: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    icon: MessageCircle,
    className: "bg-primary-soft text-primary",
  },
  email: { label: "Email", icon: Mail, className: "bg-info-soft text-info-text" },
  sms: {
    label: "SMS",
    icon: Smartphone,
    className: "bg-surface-secondary text-text-secondary",
  },
};

/**
 * Channel is the thing a merchant scans a campaign list by, so it gets an icon
 * chip rather than a word — three shapes read faster than three labels.
 */
export function ChannelChip({
  channel,
  showLabel = true,
  className,
}: {
  channel: MarketingChannel;
  showLabel?: boolean;
  className?: string;
}) {
  const meta = CHANNEL_META[channel];
  const Icon = meta.icon;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-btn",
          meta.className,
        )}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>
      {showLabel ? (
        <span className="text-sm text-text-secondary">{meta.label}</span>
      ) : (
        <span className="sr-only">{meta.label}</span>
      )}
    </span>
  );
}

export const channelLabel = (channel: MarketingChannel) => CHANNEL_META[channel].label;
