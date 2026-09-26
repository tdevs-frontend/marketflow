import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Inbox,
  Pause,
  Pencil,
  Play,
  ShieldCheck,
  ShieldOff,
  ShieldQuestion,
  type LucideIcon,
} from "lucide-react";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { CONSENT_LABEL, submissionStatusLabel } from "@/constants/forms";
import type { ConsentState, FormStatus, SubmissionStatus } from "@/types/form";

/**
 * Every state in the Forms module, as a badge.
 *
 * Tone, glyph and word together - the same rule the Automation badges follow,
 * so a paused form and a paused workflow read as the same state, and status is
 * never carried by colour alone.
 */

interface StateStyle {
  tone: BadgeVariant;
  icon: LucideIcon;
  label: string;
}

const FORM_STATE: Record<FormStatus, StateStyle> = {
  active: { tone: "success", icon: Play, label: "Active" },
  paused: { tone: "warning", icon: Pause, label: "Paused" },
  draft: { tone: "default", icon: Pencil, label: "Draft" },
};

export function FormStatusBadge({ status }: { status: FormStatus }) {
  const { tone, icon: Icon, label } = FORM_STATE[status];

  return (
    <Badge variant={tone} icon={<Icon aria-hidden />}>
      {label}
    </Badge>
  );
}

const SUBMISSION_STATE: Record<SubmissionStatus, { tone: BadgeVariant; icon: LucideIcon }> = {
  processed: { tone: "success", icon: CheckCircle2 },
  new: { tone: "info", icon: Inbox },
  awaiting_confirmation: { tone: "warning", icon: Clock },
  duplicate: { tone: "neutral", icon: Copy },
  spam: { tone: "error", icon: AlertTriangle },
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const { tone, icon: Icon } = SUBMISSION_STATE[status];

  return (
    <Badge variant={tone} casing="none" icon={<Icon aria-hidden />}>
      {submissionStatusLabel(status)}
    </Badge>
  );
}

const CONSENT_STATE: Record<ConsentState, { tone: BadgeVariant; icon: LucideIcon }> = {
  granted: { tone: "success", icon: ShieldCheck },
  pending: { tone: "warning", icon: ShieldQuestion },
  not_given: { tone: "neutral", icon: ShieldOff },
};

export function ConsentBadge({ consent }: { consent: ConsentState }) {
  const { tone, icon: Icon } = CONSENT_STATE[consent];

  return (
    <Badge variant={tone} casing="none" icon={<Icon aria-hidden />}>
      {CONSENT_LABEL[consent]}
    </Badge>
  );
}
