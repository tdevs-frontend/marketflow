import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { CampaignStatus } from "@/types/campaign";

const TONES: Record<CampaignStatus, BadgeVariant> = {
  draft: "default",
  scheduled: "info",
  sending: "info",
  sent: "success",
  paused: "warning",
  failed: "error",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge variant={TONES[status]}>{status}</Badge>;
}
