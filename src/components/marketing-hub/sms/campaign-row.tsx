import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { CampaignStatus } from "@/types/marketing";

/**
 * SMS status vocabulary.
 *
 * Same shared `CampaignStatus` as the other channels, with the words SMS
 * people use: a broadcast is "Sending" and then "Delivered", because on this
 * channel the delivery receipt is the completion event — there is no open to
 * wait for afterwards.
 */
const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  running: "Sending",
  completed: "Delivered",
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

export function SmsCampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}

export const SMS_STATUS_OPTIONS: { value: CampaignStatus; label: string }[] = (
  ["draft", "scheduled", "running", "completed", "paused", "failed"] as CampaignStatus[]
).map((value) => ({ value, label: STATUS_LABELS[value] }));
