import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { ContactStatus } from "@/types/contact";
import type { LeadStage } from "@/types/lead";

const CONTACT_TONES: Record<ContactStatus, BadgeVariant> = {
  active: "success",
  unsubscribed: "default",
  bounced: "warning",
  blocked: "error",
};

const STAGE_TONES: Record<LeadStage, BadgeVariant> = {
  new: "info",
  contacted: "info",
  qualified: "info",
  proposal: "warning",
  negotiation: "warning",
  won: "success",
  lost: "error",
};

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  return <Badge variant={CONTACT_TONES[status]}>{status}</Badge>;
}

export function LeadStageBadge({ stage }: { stage: LeadStage }) {
  return <Badge variant={STAGE_TONES[stage]}>{stage}</Badge>;
}
