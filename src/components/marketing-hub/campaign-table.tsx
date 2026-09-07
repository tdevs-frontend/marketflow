"use client";

import Link from "next/link";
import {
  Copy,
  Eye,
  Pause,
  Pencil,
  Play,
  Trash2,
  Archive,
} from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Menu } from "@/components/ui/menu";
import {
  SortableTH,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  type SortDirection,
} from "@/components/ui/table";
import { APP_ROUTES } from "@/constants";
import { rateOf } from "@/lib/marketing-fixtures";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/types/marketing";
import { CampaignStatusBadge, ChannelChip } from "./campaign-status";

export type CampaignSortField = "name" | "sent" | "openRate" | "createdAt";

interface Props {
  campaigns: Campaign[];
  /** Omit to render the read-only variant used on the overview. */
  selection?: {
    selected: string[];
    onToggle: (id: string) => void;
    onToggleAll: () => void;
    allOnPage: boolean;
    someOnPage: boolean;
  };
  sort?: {
    field: CampaignSortField;
    direction: SortDirection;
    onSort: (field: CampaignSortField) => void;
  };
  /** Trimmed column set for the overview card. */
  compact?: boolean;
}

/**
 * The campaign list, shared by the Marketing overview and the Campaigns page.
 *
 * "Open rate" means reads on WhatsApp and opens on email; SMS has neither, so
 * those cells show a dash rather than a misleading 0%.
 */
export function CampaignTable({ campaigns, selection, sort, compact = false }: Props) {
  const actions = (campaign: Campaign) => {
    const running = campaign.status === "running";

    return [
      { label: "View report", icon: <Eye className="size-4" />, onSelect: () => {} },
      { label: "Edit campaign", icon: <Pencil className="size-4" />, onSelect: () => {} },
      { label: "Duplicate", icon: <Copy className="size-4" />, onSelect: () => {} },
      {
        label: running ? "Pause campaign" : "Resume campaign",
        icon: running ? <Pause className="size-4" /> : <Play className="size-4" />,
        onSelect: () => {},
        disabled: !["running", "paused", "scheduled"].includes(campaign.status),
      },
      { label: "Archive", icon: <Archive className="size-4" />, onSelect: () => {} },
      {
        label: "Delete",
        icon: <Trash2 className="size-4" />,
        onSelect: () => {},
        destructive: true,
      },
    ];
  };

  const openRate = (campaign: Campaign) =>
    campaign.channel === "sms"
      ? null
      : rateOf(campaign.opened, campaign.delivered);

  return (
    <>
      {/* Desktop */}
      <div className="max-lg:hidden">
        <Table minWidth={compact ? "62rem" : "76rem"}>
          <THead>
            {selection ? (
              <TH className="w-10 pr-0">
                <Checkbox
                  checked={selection.allOnPage}
                  indeterminate={!selection.allOnPage && selection.someOnPage}
                  onCheckedChange={selection.onToggleAll}
                  label="Select all campaigns on this page"
                />
              </TH>
            ) : null}

            {sort ? (
              <SortableTH
                field="name"
                activeField={sort.field}
                direction={sort.direction}
                onSort={sort.onSort}
              >
                Campaign
              </SortableTH>
            ) : (
              <TH>Campaign</TH>
            )}

            <TH>Channel</TH>
            <TH>Audience</TH>

            {sort ? (
              <SortableTH
                field="sent"
                activeField={sort.field}
                direction={sort.direction}
                onSort={sort.onSort}
                align="right"
              >
                Sent
              </SortableTH>
            ) : (
              <TH align="right">Sent</TH>
            )}

            {compact ? null : <TH align="right">Delivered</TH>}

            {sort ? (
              <SortableTH
                field="openRate"
                activeField={sort.field}
                direction={sort.direction}
                onSort={sort.onSort}
                align="right"
              >
                Open rate
              </SortableTH>
            ) : (
              <TH align="right">Open rate</TH>
            )}

            <TH align="right">CTR</TH>
            <TH>Status</TH>

            {sort ? (
              <SortableTH
                field="createdAt"
                activeField={sort.field}
                direction={sort.direction}
                onSort={sort.onSort}
              >
                Created
              </SortableTH>
            ) : (
              <TH>Created</TH>
            )}

            <TH align="right">Actions</TH>
          </THead>

          <TBody>
            {campaigns.map((campaign) => {
              const open = openRate(campaign);
              const ctr = rateOf(campaign.clicked, campaign.delivered);
              const isSelected = selection?.selected.includes(campaign.id) ?? false;

              return (
                <TR key={campaign.id} selected={isSelected}>
                  {selection ? (
                    <TD className="pr-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => selection.onToggle(campaign.id)}
                        label={`Select ${campaign.name}`}
                      />
                    </TD>
                  ) : null}

                  <TD>
                    <Link
                      href={APP_ROUTES.marketingCampaigns}
                      className="block max-w-64 truncate font-medium text-text-primary transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      {campaign.name}
                    </Link>
                  </TD>

                  <TD>
                    <ChannelChip channel={campaign.channel} />
                  </TD>

                  <TD>
                    <p className="text-text-secondary">{campaign.audienceLabel}</p>
                    <p className="text-[11px] text-text-muted">
                      {formatNumber(campaign.audienceSize)} contacts
                    </p>
                  </TD>

                  <TD align="right" className="tabular-nums">
                    {formatNumber(campaign.sent)}
                  </TD>

                  {compact ? null : (
                    <TD align="right" className="text-text-secondary tabular-nums">
                      {formatNumber(campaign.delivered)}
                    </TD>
                  )}

                  <TD align="right" className="tabular-nums">
                    {open === null ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      <span className="font-medium text-text-primary">
                        {formatPercent(open)}
                      </span>
                    )}
                  </TD>

                  <TD align="right" className="text-text-secondary tabular-nums">
                    {campaign.delivered === 0 ? "—" : formatPercent(ctr)}
                  </TD>

                  <TD>
                    <CampaignStatusBadge status={campaign.status} />
                  </TD>

                  <TD className="text-xs whitespace-nowrap text-text-muted">
                    {formatDate(campaign.createdAt)}
                  </TD>

                  <TD align="right">
                    <Menu
                      items={actions(campaign)}
                      label={`Actions for ${campaign.name}`}
                    />
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </div>

      {/* Mobile */}
      <ul className="space-y-2.5 lg:hidden">
        {campaigns.map((campaign) => {
          const open = openRate(campaign);
          const isSelected = selection?.selected.includes(campaign.id) ?? false;

          return (
            <li
              key={campaign.id}
              className={cn(
                "rounded-panel border p-3.5 transition-colors",
                isSelected ? "border-primary bg-primary-subtle" : "border-border",
              )}
            >
              <div className="flex items-start gap-3">
                {selection ? (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => selection.onToggle(campaign.id)}
                    label={`Select ${campaign.name}`}
                    className="mt-1"
                  />
                ) : null}

                <ChannelChip channel={campaign.channel} showLabel={false} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {campaign.name}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {campaign.audienceLabel} · {formatDate(campaign.createdAt)}
                  </p>
                </div>

                <Menu items={actions(campaign)} label={`Actions for ${campaign.name}`} />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <CampaignStatusBadge status={campaign.status} />
                <dl className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <dt className="text-text-muted">Sent</dt>
                    <dd className="font-medium text-text-primary tabular-nums">
                      {formatNumber(campaign.sent)}
                    </dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <dt className="text-text-muted">Open</dt>
                    <dd className="font-medium text-text-primary tabular-nums">
                      {open === null ? "—" : formatPercent(open)}
                    </dd>
                  </div>
                </dl>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
