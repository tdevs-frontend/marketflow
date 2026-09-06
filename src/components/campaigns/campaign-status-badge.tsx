import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { CampaignStatus } from "@/types/campaign";

const TONES: Record<CampaignStatus, BadgeTone> = {
  draft: "neutral",
  scheduled: "info",
  sending: "info",
  sent: "success",
  paused: "warning",
  failed: "danger",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge tone={TONES[status]}>{status}</Badge>;
}
