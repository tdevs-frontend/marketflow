"use client";

import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, Inbox, MessageSquareReply, RotateCcw } from "lucide-react";

import { AvatarLabel } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useDismissable } from "@/components/ui/menu";
import { SUPPORT_ROUTES } from "@/constants/support";
import { formatDateTime } from "@/lib/format";
import { agentById } from "@/lib/support-fixtures";
import { CURRENT_AGENT, useDeskAlerts, type DeskAlert } from "@/lib/support-service";
import { WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import { cn } from "@/lib/utils";

/**
 * The Admin area's frame.
 *
 * Deliberately not the merchant dashboard's: no workspace sidebar, no
 * merchant navigation, nothing a merchant route renders. It is the stand-in
 * for MarketFlow's separate Admin Dashboard - see `constants/roles`, which
 * says that application lives elsewhere - built here so the two sides of the
 * help desk can be exercised together, and meant to be lifted into that app.
 * The header follows the dashboard header's height and ground so the product
 * reads as one family.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const agent = agentById(CURRENT_AGENT.agentId);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-18 items-center gap-4 border-b border-border bg-surface/85 px-4 backdrop-blur sm:px-6">
        <Link
          href={SUPPORT_ROUTES.desk}
          className="inline-flex shrink-0 items-center gap-2.5 rounded-btn focus-visible:shadow-focus focus-visible:outline-none"
        >
          <Logo height={28} />
          <Badge variant="solid" casing="none" className="max-sm:hidden">
            Admin
          </Badge>
        </Link>

        <nav aria-label="Admin" className="flex items-center gap-1">
          <Link
            href={SUPPORT_ROUTES.desk}
            className="rounded-btn bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary-dark focus-visible:shadow-focus focus-visible:outline-none"
          >
            Support Desk
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <DeskAlerts />
          {agent ? (
            <AvatarLabel name={agent.name} secondary={agent.title} size="sm" className="max-md:hidden" />
          ) : null}
        </div>
      </header>
      <main className="flex-1 space-y-6 p-4 sm:p-6 md:p-7">{children}</main>
    </div>
  );
}

const ALERT_ICON: Record<DeskAlert["kind"], typeof Bell> = {
  new_ticket: Inbox,
  urgent: AlertTriangle,
  merchant_replied: MessageSquareReply,
  reopened: RotateCcw,
};

/**
 * The desk's alerts - new, urgent, replied, reopened - behind a bell.
 *
 * The count is the last 24 hours on the workspace clock. The panel reuses the
 * menu's dismiss behaviour (`useDismissable`), so Escape and outside clicks
 * work the way they do on every other dropdown in the product.
 */
function DeskAlerts() {
  const alerts = useDeskAlerts(CURRENT_AGENT);
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismissable(open, useCallback(() => setOpen(false), []), wrapper, trigger);

  const recent = alerts.filter(
    (alert) => WORKSPACE_NOW_MS - new Date(alert.createdAt).getTime() <= 86_400_000,
  );

  return (
    <div ref={wrapper} className="relative">
      <IconButton
        ref={trigger}
        label={`Desk alerts, ${recent.length} in the last 24 hours`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="relative"
      >
        <Bell aria-hidden />
        {recent.length ? (
          <span className="absolute -top-1 -right-1 grid min-w-4.5 place-items-center rounded-full bg-error px-1 text-xs font-bold text-white">
            {recent.length}
          </span>
        ) : null}
      </IconButton>

      {open ? (
        <div
          role="dialog"
          aria-label="Desk alerts"
          className="absolute top-full right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-panel border border-border bg-surface p-2 shadow-float"
        >
          <p className="px-2 py-1.5 text-sm font-bold text-text-primary">Desk alerts</p>
          <ul className="custom-scrollbar max-h-96 overflow-y-auto">
            {alerts.slice(0, 12).map((alert) => {
              const Icon = ALERT_ICON[alert.kind];
              return (
                <li key={alert.id}>
                  <Link
                    href={SUPPORT_ROUTES.deskTicket(alert.ticketNumber)}
                    onClick={() => setOpen(false)}
                    className="flex gap-2.5 rounded-btn px-2 py-2 transition-colors hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-7 shrink-0 place-items-center rounded-btn",
                        alert.kind === "urgent" ? "bg-error-soft text-error-text" : "bg-surface-secondary text-text-secondary",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-text-primary">{alert.title}</span>
                      <span className="block truncate text-sm text-text-secondary">{alert.message}</span>
                      <span className="block text-sm text-text-muted">{formatDateTime(alert.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
