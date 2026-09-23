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
 * What each metric column is called, for the channels in the list.
 *
 * Social does not send, deliver or get opened - it publishes, reaches and is
 * engaged with. Forcing it through the messaging vocabulary would mean showing
 * a post's reach under a column headed "Delivered", which is worse than showing
 * nothing. When the list is entirely social the headers change to match; in a
 * mixed list they stay generic and the social rows carry their own unit, so
 * `4 posts` never reads as four messages.
 */
const MESSAGING_HEADERS = {
  primary: "Sent",
  secondary: "Delivered",
  rate: "Open rate",
} as const;

const SOCIAL_HEADERS = {
  primary: "Posts",
  secondary: "Reach",
  rate: "Engagement",
} as const;

/**
 * The campaign list, shared by the Marketing overview and the Campaigns page.
 *
 * "Open rate" means reads on WhatsApp and opens on email; SMS has neither, and
 * a social post has no such thing at all, so those cells show a dash rather
 * than a misleading 0%.
 */
export function CampaignTable({ campaigns, selection, sort, compact = false }: Props) {
  const allSocial =
    campaigns.length > 0 && campaigns.every((item) => item.channel === "social");
  const headers = allSocial ? SOCIAL_HEADERS : MESSAGING_HEADERS;
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

  /**
   * The rate column's value, in whatever the row's channel actually measures.
   *
   * SMS has no opens and never did. Social has no opens either, but it does
   * have engagement against impressions - a real rate, from a real
   * denominator, so it gets one rather than a dash.
   */
  const rateValue = (campaign: Campaign) => {
    if (campaign.channel === "sms") return null;
    if (campaign.channel === "social") {
      const social = campaign.social;
      if (!social || social.impressions === 0) return null;
      return rateOf(social.engagements, social.impressions);
    }
    return rateOf(campaign.opened, campaign.delivered);
  };

  /** Posts published, or messages sent. */
  const primaryValue = (campaign: Campaign) =>
    campaign.channel === "social"
      ? (campaign.social?.publishedPosts ?? 0)
      : campaign.sent;

  /** People reached, or messages delivered. */
  const secondaryValue = (campaign: Campaign) =>
    campaign.channel === "social"
      ? (campaign.social?.reach ?? 0)
      : campaign.delivered;

  /**
   * Clicks over the right denominator.
   *
   * Impressions for social, delivered messages for everything else - dividing a
   * post's clicks by `delivered` would be dividing by zero.
   */
  const clickRate = (campaign: Campaign) => {
    if (campaign.channel === "social") {
      const impressions = campaign.social?.impressions ?? 0;
      return impressions === 0 ? null : rateOf(campaign.clicked, impressions);
    }
    return campaign.delivered === 0
      ? null
      : rateOf(campaign.clicked, campaign.delivered);
  };

  /** The unit suffix a social row needs when the headers stay generic. */
  const unit = (campaign: Campaign, word: string) =>
    !allSocial && campaign.channel === "social" ? (
      <span className="ml-1 text-sm font-medium text-text-muted">{word}</span>
    ) : null;

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
                {headers.primary}
              </SortableTH>
            ) : (
              <TH align="right">{headers.primary}</TH>
            )}

            {compact ? null : <TH align="right">{headers.secondary}</TH>}

            {sort ? (
              <SortableTH
                field="openRate"
                activeField={sort.field}
                direction={sort.direction}
                onSort={sort.onSort}
                align="right"
              >
                {headers.rate}
              </SortableTH>
            ) : (
              <TH align="right">{headers.rate}</TH>
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
              const open = rateValue(campaign);
              const ctr = clickRate(campaign);
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
                      className="block max-w-64 truncate font-bold text-text-primary transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      {campaign.name}
                    </Link>
                  </TD>

                  <TD>
                    <ChannelChip channel={campaign.channel} />
                  </TD>

                  <TD>
                    <p className="text-text-secondary">{campaign.audienceLabel}</p>
                    <p className="text-sm text-text-muted">
                      {campaign.channel === "social"
                        ? `${campaign.social?.platforms.length ?? 0} platform${
                            campaign.social?.platforms.length === 1 ? "" : "s"
                          }`
                        : `${formatNumber(campaign.audienceSize)} contacts`}
                    </p>
                  </TD>

                  <TD align="right" className="tabular-nums">
                    {formatNumber(primaryValue(campaign))}
                    {unit(campaign, "posts")}
                  </TD>

                  {compact ? null : (
                    <TD align="right" className="text-text-secondary tabular-nums">
                      {formatNumber(secondaryValue(campaign))}
                      {unit(campaign, "reached")}
                    </TD>
                  )}

                  <TD align="right" className="tabular-nums">
                    {open === null ? (
                      <span className="text-text-muted">-</span>
                    ) : (
                      <span className="font-bold text-text-primary">
                        {formatPercent(open)}
                      </span>
                    )}
                  </TD>

                  <TD align="right" className="text-text-secondary tabular-nums">
                    {ctr === null ? "-" : formatPercent(ctr)}
                  </TD>

                  <TD>
                    <CampaignStatusBadge status={campaign.status} />
                  </TD>

                  <TD className="text-sm whitespace-nowrap text-text-muted">
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
          const open = rateValue(campaign);
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
                  <p className="mt-0.5 text-sm text-text-muted">
                    {campaign.audienceLabel} · {formatDate(campaign.createdAt)}
                  </p>
                </div>

                <Menu items={actions(campaign)} label={`Actions for ${campaign.name}`} />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <CampaignStatusBadge status={campaign.status} />
                <dl className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <dt className="text-text-muted">
                      {campaign.channel === "social" ? "Posts" : "Sent"}
                    </dt>
                    <dd className="font-medium text-text-primary tabular-nums">
                      {formatNumber(primaryValue(campaign))}
                    </dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <dt className="text-text-muted">
                      {campaign.channel === "social" ? "Engaged" : "Open"}
                    </dt>
                    <dd className="font-medium text-text-primary tabular-nums">
                      {open === null ? "-" : formatPercent(open)}
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
