import { Mail, MessageCircle, Share2, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PanelLabel, ProductFrame } from "./feature-section";

/**
 * The campaigns table, as `/dashboard/marketing/campaigns` lists it.
 *
 * Four rows, one per channel MarketFlow can send on, each carrying the four
 * numbers a marketer actually checks: who it went to, how many opened it, how
 * many replied or clicked, and what it converted. A campaign list that shows
 * only names and statuses is a to-do list; these columns are why the page is
 * worth opening.
 *
 * The statuses are real states — Sending, Scheduled, Completed — and one row is
 * mid-flight with a progress bar, because a campaign page that only ever shows
 * finished work does not look like software anybody uses on a Tuesday.
 *
 * Channel colours come from the same channel ramps the dashboard uses, so a
 * WhatsApp row here is the green a WhatsApp row is everywhere else.
 */

interface Row {
  name: string;
  channel: string;
  icon: LucideIcon;
  tone: string;
  status: "Sending" | "Scheduled" | "Completed";
  audience: string;
  engaged: string;
  converted: string;
  /** Set on the row that is mid-send. */
  progress?: number;
}

const ROWS: Row[] = [
  {
    name: "Eid Collection Launch",
    channel: "WhatsApp",
    icon: MessageCircle,
    tone: "bg-whatsapp-soft text-whatsapp",
    status: "Sending",
    audience: "8,420",
    engaged: "6,180",
    converted: "912",
    progress: 68,
  },
  {
    name: "September Newsletter",
    channel: "Email",
    icon: Mail,
    tone: "bg-email-soft text-email",
    status: "Completed",
    audience: "12,480",
    engaged: "4,240",
    converted: "586",
  },
  {
    name: "Cart Recovery",
    channel: "SMS",
    icon: Smartphone,
    tone: "bg-sms-soft text-sms",
    status: "Scheduled",
    audience: "1,960",
    engaged: "—",
    converted: "—",
  },
  {
    name: "Studio Reveal Post",
    channel: "Social",
    icon: Share2,
    tone: "bg-primary-subtle text-secondary",
    status: "Completed",
    audience: "24,600",
    engaged: "3,180",
    converted: "214",
  },
];

const STATUS_TONE: Record<Row["status"], string> = {
  Sending: "bg-primary-soft text-primary-dark",
  Scheduled: "bg-surface-secondary text-text-secondary",
  Completed: "bg-success-soft text-success-text",
};

export function CampaignVisual() {
  return (
    <ProductFrame path="/dashboard/marketing/campaigns" status="4 running">
      <div className="space-y-3 bg-background p-3 sm:p-4">
        {/* The three figures that head the page. */}
        <dl className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Reach", value: "47,460" },
            { label: "Engaged", value: "13,600" },
            { label: "Conversions", value: "1,712" },
          ].map((stat) => (
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

        <div className="rounded-panel border border-border bg-surface p-3">
          <PanelLabel>Campaigns</PanelLabel>

          <ul className="mt-2.5 divide-y divide-border">
            {ROWS.map((row) => (
              <li key={row.name} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-btn ${row.tone}`}
                  >
                    <row.icon className="size-3.5" aria-hidden />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-text-primary">
                      {row.name}
                    </p>
                    <p className="truncate text-[11px] text-text-muted">
                      {row.channel} · {row.audience} contacts
                    </p>
                  </div>

                  <span
                    className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline-block ${STATUS_TONE[row.status]}`}
                  >
                    {row.status}
                  </span>

                  <div className="hidden w-14 shrink-0 text-right sm:block">
                    <p className="text-xs font-bold text-text-primary tabular-nums">
                      {row.converted}
                    </p>
                    <p className="text-[10px] text-text-muted">converted</p>
                  </div>
                </div>

                {row.progress ? (
                  <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-surface-secondary">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${row.progress}%` }}
                    />
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ProductFrame>
  );
}
