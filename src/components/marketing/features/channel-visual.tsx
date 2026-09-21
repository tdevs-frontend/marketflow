"use client";

import { useState } from "react";
import { Mail, Send, Smartphone } from "lucide-react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import { PanelLabel, ProductFrame } from "./feature-section";

/**
 * Email and SMS, in one frame with a switch.
 *
 * Both channels ship the same five surfaces — campaigns, templates, senders,
 * contacts, analytics — so two full sections would be the same screenshot
 * twice with the nouns changed. The switch is the honest way to say "these work
 * the same": the frame, the panels and the layout hold still, and only the
 * numbers and the one thing that genuinely differs change.
 *
 * What genuinely differs is the bottom panel. Email lives or dies on
 * deliverability — SPF, DKIM, DMARC, bounce rate — and SMS lives or dies on
 * delivery receipts and segment counts. Showing each channel its own third
 * panel is the reason this is a switcher rather than a toggle over identical
 * content.
 *
 * `SegmentedControl` is the product's own filter control, used here exactly as
 * the dashboard uses it, so the switch is not a bespoke marketing widget.
 */

type Channel = "email" | "sms";

const STATS: Record<Channel, { label: string; value: string }[]> = {
  email: [
    { label: "Sent today", value: "2,480" },
    { label: "Delivered", value: "98.4%" },
    { label: "Opened", value: "34.2%" },
  ],
  sms: [
    { label: "Sent today", value: "612" },
    { label: "Delivered", value: "94.2%" },
    { label: "Clicked", value: "11.8%" },
  ],
};

const TEMPLATES: Record<Channel, { name: string; meta: string }[]> = {
  email: [
    { name: "Welcome series — 1", meta: "Automation · 1,240 sends" },
    { name: "Abandoned cart", meta: "Automation · 860 sends" },
    { name: "Monthly newsletter", meta: "Campaign · 12,480 sends" },
  ],
  sms: [
    { name: "Order shipped", meta: "Transactional · 940 sends" },
    { name: "Flash sale", meta: "Campaign · 1,960 sends" },
    { name: "Appointment reminder", meta: "Automation · 420 sends" },
  ],
};

/** The third panel: what each channel is actually judged on. */
const HEALTH: Record<
  Channel,
  { title: string; rows: { label: string; value: string; ok: boolean }[] }
> = {
  email: {
    title: "Deliverability",
    rows: [
      { label: "SPF", value: "Passing", ok: true },
      { label: "DKIM", value: "Passing", ok: true },
      { label: "DMARC", value: "p=none", ok: false },
      { label: "Bounce rate", value: "1.2%", ok: true },
    ],
  },
  sms: {
    title: "Delivery",
    rows: [
      { label: "Sender ID", value: "MRKTFLOW", ok: true },
      { label: "Routes", value: "BD, IN", ok: true },
      { label: "Opt-outs", value: "0.4%", ok: true },
      { label: "Queued", value: "214", ok: false },
    ],
  },
};

const PATH: Record<Channel, string> = {
  email: "/dashboard/marketing/email/campaigns",
  sms: "/dashboard/marketing/sms/campaigns",
};

export function ChannelVisual() {
  const [channel, setChannel] = useState<Channel>("email");

  const ChannelIcon = channel === "email" ? Mail : Smartphone;
  const health = HEALTH[channel];

  return (
    <div className="space-y-3">
      <div className="flex justify-center lg:justify-start">
        <SegmentedControl<Channel>
          options={[
            { value: "email", label: "Email" },
            { value: "sms", label: "SMS" },
          ]}
          value={channel}
          onChange={setChannel}
          label="Choose a channel"
          variant="filter"
        />
      </div>

      <ProductFrame path={PATH[channel]} status={channel === "email" ? "Live" : "Live"}>
        <div className="space-y-3 bg-background p-3 sm:p-4">
          <dl className="grid grid-cols-3 gap-2.5">
            {STATS[channel].map((stat) => (
              <div
                key={stat.label}
                className="rounded-panel border border-border bg-surface p-3"
              >
                <dt className="truncate text-[11px] font-medium text-text-muted">
                  {stat.label}
                </dt>
                <dd className="mt-1 font-heading text-lg leading-none font-bold text-text-primary tabular-nums">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="rounded-panel border border-border bg-surface p-3">
              <div className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-btn bg-primary-soft text-primary">
                  <ChannelIcon className="size-3" aria-hidden />
                </span>
                <PanelLabel>Templates</PanelLabel>
              </div>

              <ul className="mt-2.5 divide-y divide-border">
                {TEMPLATES[channel].map((template) => (
                  <li
                    key={template.name}
                    className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-text-primary">
                        {template.name}
                      </span>
                      <span className="block truncate text-[11px] text-text-muted">
                        {template.meta}
                      </span>
                    </span>
                    <Send
                      className="size-3 shrink-0 text-text-muted"
                      aria-hidden
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-panel border border-border bg-surface p-3">
              <PanelLabel>{health.title}</PanelLabel>
              <ul className="mt-2.5 space-y-2">
                {health.rows.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-baseline justify-between gap-2"
                  >
                    <span className="truncate text-[11px] text-text-secondary">
                      {row.label}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[11px] font-bold",
                        row.ok ? "text-text-primary" : "text-warning-text",
                      )}
                    >
                      {row.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </ProductFrame>
    </div>
  );
}
