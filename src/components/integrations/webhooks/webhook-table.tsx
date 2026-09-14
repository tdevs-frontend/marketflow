"use client";

import { Pause, Play, Send, Trash2 } from "lucide-react";

import { Menu } from "@/components/ui/menu";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCount, formatPercent, formatRelativeTime } from "@/lib/format";
import { INTEGRATIONS_NOW_MS } from "@/lib/integration-fixtures";
import { cn } from "@/lib/utils";
import type { Webhook } from "@/types/integration";
import { WebhookStatusBadge } from "../integration-badges";
import { EventKeyList } from "./event-picker";

/**
 * The endpoint list.
 *
 * Name over URL in one cell rather than two columns: the URL is long, the name
 * is what a merchant recognises, and splitting them costs the width the events
 * column needs. The row opens the detail drawer; the kebab holds the actions
 * that should not be one misclick away from a delivery log.
 *
 * Success rate is coloured only when it has fallen — a column of green
 * percentages trains the eye to skip it, which is the opposite of what a health
 * figure is for.
 */
export function WebhookTable({
  webhooks,
  onOpen,
  onToggle,
  onTest,
  onDelete,
}: {
  webhooks: Webhook[];
  onOpen: (webhook: Webhook) => void;
  onToggle: (webhook: Webhook) => void;
  onTest: (webhook: Webhook) => void;
  onDelete: (webhook: Webhook) => void;
}) {
  return (
    <Table minWidth="64rem">
      <THead>
        <TH>Endpoint</TH>
        <TH>Events</TH>
        <TH>Status</TH>
        <TH align="right">Success Rate</TH>
        <TH>Last Delivery</TH>
        <TH align="right">
          <span className="sr-only">Actions</span>
        </TH>
      </THead>

      <TBody>
        {webhooks.map((webhook) => (
          <TR
            key={webhook.id}
            onClick={() => onOpen(webhook)}
            className="cursor-pointer"
          >
            <TD className="max-w-xs">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(webhook);
                }}
                className="block max-w-full text-left focus-visible:shadow-focus focus-visible:outline-none"
              >
                <span className="block truncate font-semibold text-text-primary">
                  {webhook.name}
                </span>
                <span className="mt-0.5 block truncate font-mono text-meta font-normal text-text-muted">
                  {webhook.url}
                </span>
              </button>
            </TD>

            <TD className="max-w-64">
              <EventKeyList events={webhook.events} max={2} />
            </TD>

            <TD>
              <WebhookStatusBadge status={webhook.status} />
            </TD>

            <TD align="right">
              <span
                className={cn(
                  "tabular-nums",
                  webhook.successRate < 99 ? "text-error" : "text-text-primary",
                )}
              >
                {formatPercent(webhook.successRate)}
              </span>
              <span className="ml-1.5 text-meta font-normal text-text-muted tabular-nums">
                {formatCount(webhook.deliveries24h)} sent
              </span>
            </TD>

            <TD className="text-text-secondary">
              {webhook.lastDeliveryAt
                ? formatRelativeTime(webhook.lastDeliveryAt, INTEGRATIONS_NOW_MS)
                : "Never"}
            </TD>

            <TD align="right">
              {/* Stops the row's own open handler firing behind the menu. */}
              <span
                onClick={(event) => event.stopPropagation()}
                className="inline-flex"
              >
                <Menu
                  label={`Actions for ${webhook.name}`}
                  items={[
                    {
                      label: "Send test event",
                      icon: <Send className="size-4" aria-hidden />,
                      onSelect: () => onTest(webhook),
                    },
                    {
                      label: webhook.status === "paused" ? "Enable" : "Disable",
                      icon:
                        webhook.status === "paused" ? (
                          <Play className="size-4" aria-hidden />
                        ) : (
                          <Pause className="size-4" aria-hidden />
                        ),
                      onSelect: () => onToggle(webhook),
                    },
                    {
                      label: "Delete endpoint",
                      icon: <Trash2 className="size-4" aria-hidden />,
                      destructive: true,
                      onSelect: () => onDelete(webhook),
                    },
                  ]}
                />
              </span>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
