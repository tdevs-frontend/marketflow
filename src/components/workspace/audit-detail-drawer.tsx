"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Drawer } from "@/components/ui/dialog";
import { AUDIT_MODULE_LABEL } from "@/constants/workspace";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import { cn } from "@/lib/utils";
import type { WorkspaceAuditEvent } from "@/types/workspace";
import { ChangeDiff } from "./change-diff";
import { AuditStatusBadge, SeverityBadge } from "./workspace-badges";

/**
 * One audit event, in full.
 *
 * The request metadata is the part worth being careful about. `ipAddress` and
 * `userAgent` render only when the record actually carries them — a system
 * action has no browser and no address, and filling those in with something
 * plausible would make a field that exists to support an investigation the
 * least trustworthy thing on the screen. Absent renders as "Not recorded".
 *
 * The target links into the module that owns it, so an audit row is a starting
 * point rather than a dead end: "published campaign Summer Sale 2026" is one
 * click from the campaign.
 */
export function AuditDetailDrawer({
  event,
  open,
  onClose,
}: {
  event: WorkspaceAuditEvent | null;
  open: boolean;
  onClose: () => void;
}) {
  const [advanced, setAdvanced] = useState(false);

  if (!event) return null;

  const facts = [
    { label: "Actor", value: event.actorName },
    { label: "Action", value: event.actionLabel },
    { label: "Module", value: AUDIT_MODULE_LABEL[event.module] },
    { label: "Resource type", value: event.resourceType },
    { label: "Timestamp", value: formatDateTime(event.createdAt) },
    {
      label: "IP address",
      value: event.ipAddress,
      /* Never invented. A system action genuinely has neither. */
      fallback: event.actorId ? "Not recorded" : "System action — no request",
    },
    {
      label: "Device",
      value: event.userAgent ? describeAgent(event.userAgent) : null,
      fallback: event.actorId ? "Not recorded" : "System action — no device",
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={event.actionLabel}
      description={formatRelativeTime(event.createdAt, WORKSPACE_NOW_MS)}
    >
      <div className="flex items-center gap-3">
        <Avatar
          name={event.actorName}
          size="md"
          tone={
            event.actorId ? undefined : "bg-surface-secondary text-text-muted"
          }
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">
            {event.actorName}
          </p>
          <p className="truncate text-sm text-text-muted">
            {event.actorId ? "Workspace member" : "Automated system action"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <AuditStatusBadge status={event.status} />
          <SeverityBadge severity={event.severity} />
        </div>
      </div>

      {/* The target, as a link where there is somewhere to go. */}
      <div className="mt-5 rounded-panel border border-border px-3.5 py-3">
        <p className="text-meta font-medium text-text-muted">Target resource</p>
        {event.resourceHref ? (
          <Link
            href={event.resourceHref}
            className="mt-1 inline-flex items-center gap-1 rounded-btn text-sm font-semibold text-primary underline-offset-2 hover:underline focus-visible:shadow-focus focus-visible:outline-none"
          >
            {event.resourceName}
            <ChevronRight className="size-3.5 shrink-0" aria-hidden />
          </Link>
        ) : (
          <p className="mt-1 text-sm font-semibold text-text-primary">
            {event.resourceName}
          </p>
        )}
      </div>

      <dl className="mt-5 space-y-3">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="flex items-baseline justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <dt className="shrink-0 text-sm text-text-muted">{fact.label}</dt>
            <dd
              className={cn(
                "min-w-0 truncate text-sm",
                fact.value
                  ? "font-medium text-text-primary"
                  : "text-text-muted italic",
              )}
            >
              {fact.value ?? fact.fallback}
            </dd>
          </div>
        ))}
      </dl>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-text-primary">Change details</h3>
        <ChangeDiff changes={event.changes} className="mt-2.5" />
      </section>

      {event.metadata && Object.keys(event.metadata).length > 0 ? (
        <section className="mt-6">
          <button
            type="button"
            onClick={() => setAdvanced((value) => !value)}
            aria-expanded={advanced}
            className="inline-flex items-center gap-1.5 rounded-btn text-sm font-medium text-text-muted transition-colors hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
          >
            <ChevronDown
              className={cn("size-4 transition-transform", advanced && "rotate-180")}
              aria-hidden
            />
            Advanced details
          </button>

          {advanced ? (
            <dl className="mt-2.5 space-y-2 rounded-panel bg-surface-secondary px-3.5 py-3">
              {Object.entries(event.metadata).map(([key, value]) => (
                <div key={key} className="flex flex-wrap gap-x-3 gap-y-0.5">
                  <dt className="text-meta font-medium text-text-muted capitalize">
                    {key}
                  </dt>
                  <dd className="min-w-0 flex-1 font-mono text-meta text-text-secondary">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      ) : null}
    </Drawer>
  );
}

/**
 * A user agent as a person would say it.
 *
 * The raw string is 120 characters of version numbers and means nothing at a
 * glance. The full value stays available in the record; this is what the row
 * shows.
 */
function describeAgent(agent: string): string {
  const os = agent.includes("Windows")
    ? "Windows"
    : agent.includes("Mac OS X")
      ? "macOS"
      : agent.includes("Android")
        ? "Android"
        : agent.includes("iPhone")
          ? "iOS"
          : "Unknown OS";

  const browser = agent.includes("Chrome/")
    ? "Chrome"
    : agent.includes("Firefox/")
      ? "Firefox"
      : agent.includes("Safari/")
        ? "Safari"
        : "Unknown browser";

  return `${os} · ${browser}`;
}
