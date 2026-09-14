import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleSlash,
  Clock,
  MinusCircle,
  Pause,
  PlugZap,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  AUTH_STATUS_LABEL,
  HEALTH_LABEL,
  INTEGRATION_STATUS_LABEL,
  WEBHOOK_STATUS_LABEL,
} from "@/constants/integrations";
import { cn } from "@/lib/utils";
import type {
  HealthStatus,
  IntegrationStatus,
  WebhookStatus,
} from "@/types/integration";
import type { AuthStatus, CapabilityState } from "@/types/social";

/**
 * Every state in the Integrations module, as a badge.
 *
 * Each one pairs a tone with an icon and a word, the way the Automation module
 * does — status is never colour alone, and on a page where four checks sit in a
 * column the glyph is what separates "Warning" from "Error" at a glance.
 *
 * The tones are deliberately restrained. A card whose whole background turns
 * amber shouts an outage at a merchant whose bounce rate ticked up 0.2%; the
 * colour lives in a 20px badge and the card stays white.
 */

interface StateStyle {
  tone: BadgeTone;
  icon: LucideIcon;
  label: string;
}

const INTEGRATION_STATE: Record<IntegrationStatus, StateStyle> = {
  connected: {
    tone: "success",
    icon: CheckCircle2,
    label: INTEGRATION_STATUS_LABEL.connected,
  },
  needs_setup: {
    tone: "neutral",
    icon: CircleDashed,
    label: INTEGRATION_STATUS_LABEL.needs_setup,
  },
  issue: {
    tone: "danger",
    icon: AlertTriangle,
    label: INTEGRATION_STATUS_LABEL.issue,
  },
  disabled: {
    tone: "neutral",
    icon: CircleSlash,
    label: INTEGRATION_STATUS_LABEL.disabled,
  },
};

export function IntegrationStatusBadge({
  status,
  size,
  className,
}: {
  status: IntegrationStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const { tone, icon: Icon, label } = INTEGRATION_STATE[status];

  return (
    <Badge tone={tone} size={size} className={cn("normal-case", className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Health                                                                     */
/* -------------------------------------------------------------------------- */

const HEALTH_STATE: Record<HealthStatus, StateStyle> = {
  healthy: { tone: "success", icon: CheckCircle2, label: HEALTH_LABEL.healthy },
  warning: { tone: "warning", icon: AlertTriangle, label: HEALTH_LABEL.warning },
  error: { tone: "danger", icon: XCircle, label: HEALTH_LABEL.error },
  disconnected: { tone: "neutral", icon: PlugZap, label: HEALTH_LABEL.disconnected },
};

/**
 * The reusable health indicator, used by WhatsApp, Email, SMS, Webhooks and
 * API alike. One vocabulary across five pages is the only way "Warning" keeps
 * meaning the same thing.
 */
export function HealthBadge({
  status,
  size,
  className,
}: {
  status: HealthStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const { tone, icon: Icon, label } = HEALTH_STATE[status];

  return (
    <Badge tone={tone} size={size} className={cn("normal-case", className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}

const DOT_TONE: Record<HealthStatus, string> = {
  healthy: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  disconnected: "bg-border-strong",
};

/**
 * The dot for places where the word is already on the line beside it — a card
 * header, a summary row. Hidden from assistive tech on purpose: it is a
 * restatement, not information, and the label carries the meaning.
 */
export function HealthDot({
  status,
  className,
}: {
  status: HealthStatus;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        DOT_TONE[status],
        className,
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Webhooks and API                                                           */
/* -------------------------------------------------------------------------- */

const WEBHOOK_STATE: Record<WebhookStatus, StateStyle> = {
  active: { tone: "success", icon: CheckCircle2, label: WEBHOOK_STATUS_LABEL.active },
  paused: { tone: "neutral", icon: Pause, label: WEBHOOK_STATUS_LABEL.paused },
  failing: { tone: "danger", icon: AlertTriangle, label: WEBHOOK_STATUS_LABEL.failing },
};

export function WebhookStatusBadge({
  status,
  size = "sm",
  className,
}: {
  status: WebhookStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const { tone, icon: Icon, label } = WEBHOOK_STATE[status];

  return (
    <Badge tone={tone} size={size} className={cn("normal-case", className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}

/**
 * An HTTP status code, toned by class.
 *
 * The code itself is the label — a developer reading a delivery log wants 504,
 * not "Gateway Timeout" spelled out in a 90px column. `null` is a request that
 * never got a response at all, which is a different failure from a 500 and is
 * named as one.
 */
export function HttpStatusBadge({
  code,
  size = "sm",
}: {
  code: number | null;
  size?: "sm" | "md";
}) {
  if (code === null) {
    return (
      <Badge tone="danger" size={size} className="normal-case tabular-nums">
        Timeout
      </Badge>
    );
  }

  const tone: BadgeTone =
    code < 300 ? "success" : code < 400 ? "info" : code < 500 ? "warning" : "danger";

  return (
    <Badge tone={tone} size={size} className="tabular-nums">
      {code}
    </Badge>
  );
}

const METHOD_TONE: Record<string, string> = {
  GET: "bg-info-soft text-info-text",
  POST: "bg-success-soft text-success-text",
  PUT: "bg-warning-soft text-warning-text",
  PATCH: "bg-warning-soft text-warning-text",
  DELETE: "bg-error-soft text-error-text",
};

/** The verb in a request log. Monospace and fixed-width so the column aligns. */
export function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-16 justify-center rounded-btn px-1.5 py-0.5 font-mono text-meta font-semibold",
        METHOD_TONE[method] ?? "bg-surface-secondary text-text-secondary",
      )}
    >
      {method}
    </span>
  );
}

/**
 * An event key, an endpoint path or a masked secret.
 *
 * Monospace, because all three are strings a developer copies rather than
 * reads — and a proportional font makes `mf_live_••••8F2A` and
 * `mf_live_••••8F2A` look identical when they are not.
 */
export function CodeText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code
      className={cn(
        "rounded-btn bg-surface-secondary px-1.5 py-0.5 font-mono text-meta text-text-secondary",
        className,
      )}
    >
      {children}
    </code>
  );
}

/* -------------------------------------------------------------------------- */
/* Social authorisation                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Token and authorisation state.
 *
 * A fifth scale on top of `HealthStatus` rather than a reuse of it, because a
 * social token fails on a clock: "Expiring Soon" has no equivalent in an SMTP
 * connection, and it is the single most useful thing this badge says — it is
 * the warning that arrives while there is still time to act on it.
 *
 * `expiring_soon` is amber rather than red on purpose. Nothing is broken yet,
 * and colouring a working connection as an outage is how merchants learn to
 * ignore the colour.
 */
const AUTH_STATE: Record<AuthStatus, StateStyle> = {
  healthy: { tone: "success", icon: ShieldCheck, label: AUTH_STATUS_LABEL.healthy },
  expiring_soon: { tone: "warning", icon: Clock, label: AUTH_STATUS_LABEL.expiring_soon },
  expired: { tone: "danger", icon: ShieldAlert, label: AUTH_STATUS_LABEL.expired },
  permission_missing: {
    tone: "warning",
    icon: ShieldAlert,
    label: AUTH_STATUS_LABEL.permission_missing,
  },
  disconnected: { tone: "neutral", icon: PlugZap, label: AUTH_STATUS_LABEL.disconnected },
};

export function AuthStatusBadge({
  status,
  size = "sm",
  className,
}: {
  status: AuthStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const { tone, icon: Icon, label } = AUTH_STATE[status];

  return (
    <Badge tone={tone} size={size} className={cn("normal-case", className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}

/**
 * Whether one capability is usable.
 *
 * Three states, not two: `needs_reauth` was granted and has lapsed — fixed by
 * pressing Reconnect — while `missing` was never available on this account and
 * reconnecting will not change it. Showing both as "off" sends a merchant
 * round an OAuth loop that cannot help them.
 */
const CAPABILITY_STATE: Record<CapabilityState, StateStyle> = {
  granted: { tone: "success", icon: CheckCircle2, label: "Granted" },
  missing: { tone: "neutral", icon: MinusCircle, label: "Not available" },
  needs_reauth: { tone: "warning", icon: AlertTriangle, label: "Needs reauthorization" },
};

export function CapabilityBadge({
  state,
  size = "sm",
  className,
}: {
  state: CapabilityState;
  size?: "sm" | "md";
  className?: string;
}) {
  const { tone, icon: Icon, label } = CAPABILITY_STATE[state];

  return (
    <Badge tone={tone} size={size} className={cn("normal-case", className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}
