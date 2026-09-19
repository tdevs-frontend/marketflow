import type { ReactNode } from "react";
import { Info, Lock, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * "Here is exactly how far this goes."
 *
 * One component rather than a sentence written eight different ways, because
 * the honesty has to be uniform to be believed. A merchant who reads a clear
 * notice on Billing and then meets a Security panel cheerfully announcing that
 * two-factor is protecting their sign-in learns that the first notice was
 * decoration — and stops reading the rest.
 *
 * The three tones map onto the three genuinely different situations in
 * Settings, and `lib/account-service.CAPABILITIES` is what decides which one a
 * panel is in:
 *
 *   `session`      The thing works and persists, for this tab. Profile and
 *                  notification preferences.
 *   `unavailable`  The control is inert because a service it needs does not
 *                  exist, and it says which. Payment method, invoices.
 *   `security`     The two places where believing a false state has a real
 *                  cost: the password form, which cannot verify your current
 *                  password, and two-factor, which verifies an authenticator
 *                  for real but does not yet gate sign-in.
 *
 * The distinction the `security` tone exists to hold is narrow and matters: a
 * TOTP code entered during setup is genuinely checked against the secret — see
 * `lib/totp` — so a mistyped setup key fails here rather than at a sign-in
 * three weeks later. What it does not do is stand between an attacker and the
 * account. Both halves have to be said, or the screen claims the second.
 */

type NoticeTone = "session" | "unavailable" | "security";

const TONES: Record<
  NoticeTone,
  { wrap: string; icon: typeof Info; iconClass: string }
> = {
  session: {
    wrap: "border-info/30 bg-info-soft",
    icon: Info,
    iconClass: "text-info-text",
  },
  unavailable: {
    wrap: "border-border-strong bg-surface-secondary",
    icon: Lock,
    iconClass: "text-text-muted",
  },
  security: {
    wrap: "border-warning/40 bg-warning-soft",
    icon: ShieldAlert,
    iconClass: "text-warning-text",
  },
};

export function ServiceNotice({
  tone = "unavailable",
  title,
  children,
  action,
  className,
}: {
  tone?: NoticeTone;
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const { wrap, icon: Icon, iconClass } = TONES[tone];

  return (
    <div
      className={cn(
        "flex flex-wrap items-start gap-3 rounded-panel border px-4 py-3.5",
        wrap,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-4.5 shrink-0", iconClass)} aria-hidden />

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-bold text-text-primary">{title}</p>
        <div className="text-sm font-medium text-text-secondary">{children}</div>
      </div>

      {action}
    </div>
  );
}
