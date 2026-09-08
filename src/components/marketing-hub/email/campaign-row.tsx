import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { CampaignStatus } from "@/types/marketing";

/**
 * Email's status vocabulary.
 *
 * The stored values are the shared `CampaignStatus`, but the words differ by
 * channel: an email campaign is "Sending" and then "Sent", where a WhatsApp
 * campaign is "Running" and then "Completed". Same state machine, the labels a
 * marketer expects for the channel they are looking at.
 */
const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  running: "Sending",
  completed: "Sent",
  paused: "Paused",
  failed: "Failed",
};

const STATUS_TONES: Record<CampaignStatus, BadgeTone> = {
  draft: "neutral",
  scheduled: "info",
  running: "success",
  completed: "brand",
  paused: "warning",
  failed: "danger",
};

export function EmailCampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}

/** Status filter options, in the order a campaign moves through them. */
export const EMAIL_STATUS_OPTIONS: { value: CampaignStatus; label: string }[] = [
  "draft",
  "scheduled",
  "running",
  "completed",
  "paused",
  "failed",
].map((value) => ({
  value: value as CampaignStatus,
  label: STATUS_LABELS[value as CampaignStatus],
}));
