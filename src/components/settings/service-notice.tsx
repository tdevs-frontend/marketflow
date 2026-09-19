import type { ReactNode } from "react";
import { Info, Lock, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * "This part needs a server, and there isn't one yet."
 *
 * One component rather than a sentence written eight different ways, because
 * the honesty has to be uniform to be believed. A merchant who reads a clear
 * notice on the Billing page and then meets a Security panel that cheerfully
 * toasts "Two-factor authentication turned on" learns that the first notice
 * was decoration.
 *
 * That toast was real, by the way — `SecuritySettings` flipped a boolean and
 * announced 2FA was on, offered a "Recovery codes" button that downloaded
 * nothing, and listed three invented devices in Dubai and London with a Sign
 * out button behind each. None of it touched a service, because there is no
 * service: no `.env`, no route handlers under `app/`, and nothing in the
 * product dispatches `setCredentials`.
 *
 * `session` is the softest tone — the thing works, it just lives in this tab.
 * `unavailable` means the control is inert and says why. `security` is for the
 * two places where believing a false state has a real cost.
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
