import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Info,
  MailCheck,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  AUDIT_STATUS_LABEL,
  MEMBER_STATUS_LABEL,
} from "@/constants/workspace";
import { cn } from "@/lib/utils";
import type {
  AuditSeverity,
  AuditStatus,
  MemberStatus,
  RoleType,
} from "@/types/workspace";

/**
 * Every state in the Workspace module, as a badge.
 *
 * Same discipline as the Automation and Integrations modules: a tone, a glyph
 * and a word, never colour alone. In an audit table where Warning and Failed
 * are both muted reds at a glance, the glyph is what separates them.
 *
 * Red is deliberately scarce here. An audit trail where half the rows are red
 * is an audit trail nobody reads — `warning` carries most of the "look at this"
 * weight and `failed` is reserved for something that did not happen.
 */

interface StateStyle {
  tone: BadgeTone;
  icon: LucideIcon;
  label: string;
}

const MEMBER_STATE: Record<MemberStatus, StateStyle> = {
  active: { tone: "success", icon: CheckCircle2, label: MEMBER_STATUS_LABEL.active },
  invited: { tone: "info", icon: MailCheck, label: MEMBER_STATUS_LABEL.invited },
  suspended: {
    tone: "neutral",
    icon: CircleSlash,
    label: MEMBER_STATUS_LABEL.suspended,
  },
};

export function MemberStatusBadge({
  status,
  size = "sm",
  className,
}: {
  status: MemberStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const { tone, icon: Icon, label } = MEMBER_STATE[status];

  return (
    <Badge tone={tone} size={size} className={cn("normal-case", className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}

const AUDIT_STATE: Record<AuditStatus, StateStyle> = {
  success: { tone: "success", icon: CheckCircle2, label: AUDIT_STATUS_LABEL.success },
  warning: { tone: "warning", icon: AlertTriangle, label: AUDIT_STATUS_LABEL.warning },
  failed: { tone: "danger", icon: XCircle, label: AUDIT_STATUS_LABEL.failed },
  info: { tone: "neutral", icon: Info, label: AUDIT_STATUS_LABEL.info },
};

export function AuditStatusBadge({
  status,
  size = "sm",
  className,
}: {
  status: AuditStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const { tone, icon: Icon, label } = AUDIT_STATE[status];

  return (
    <Badge tone={tone} size={size} className={cn("normal-case", className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}

/**
 * System roles cannot be deleted, and the badge is where a merchant learns
 * that before they go looking for the button.
 */
export function RoleTypeBadge({
  type,
  size = "sm",
  className,
}: {
  type: RoleType;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <Badge
      tone={type === "system" ? "neutral" : "brand"}
      size={size}
      className={cn("normal-case", className)}
    >
      {type === "system" ? "System role" : "Custom role"}
    </Badge>
  );
}

/**
 * The security marker on an audit row.
 *
 * Rendered only for `security` events, not for all three severities: a badge
 * that appears on every row carries no information, and "normal" needs no
 * label. High-impact rows are found through the filter rather than a second
 * chip competing with the status.
 */
export function SeverityBadge({
  severity,
  className,
}: {
  severity: AuditSeverity;
  className?: string;
}) {
  if (severity !== "security") return null;

  return (
    <Badge tone="warning" size="sm" className={cn("normal-case", className)}>
      <ShieldCheck className="size-3" aria-hidden />
      Security
    </Badge>
  );
}
