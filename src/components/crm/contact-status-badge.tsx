import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { ContactStatus } from "@/types/contact";
import type { LeadStage } from "@/types/lead";

const CONTACT_TONES: Record<ContactStatus, BadgeTone> = {
  active: "success",
  unsubscribed: "neutral",
  bounced: "warning",
  blocked: "danger",
};

const STAGE_TONES: Record<LeadStage, BadgeTone> = {
  new: "info",
  contacted: "info",
  qualified: "info",
  proposal: "warning",
  negotiation: "warning",
  won: "success",
  lost: "danger",
};

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  return <Badge tone={CONTACT_TONES[status]}>{status}</Badge>;
}

export function LeadStageBadge({ stage }: { stage: LeadStage }) {
  return <Badge tone={STAGE_TONES[stage]}>{stage}</Badge>;
}
