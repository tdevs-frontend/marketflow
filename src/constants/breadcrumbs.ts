import type { Crumb } from "@/components/ui/breadcrumb";
import { CHANNEL_THEME, type Channel } from "./channels";

/**
 * Breadcrumb trails for the marketing module.
 *
 * Built here rather than derived from the pathname: the sidebar's grouping and
 * the URL do not match one-for-one — `Social Planner` is one nav group over
 * `/marketing/social/*` — and a trail generated from route segments would read
 * "Dashboard / Marketing / Social / Calendar" where the product says
 * "Marketing / Social Planner / Calendar".
 */

const DASHBOARD: Crumb = { label: "Dashboard", href: "/dashboard" };
const MARKETING: Crumb = { label: "Marketing", href: "/dashboard/marketing" };

/** A trail into one of the channel modules. */
export function channelCrumbs(channel: Channel, page: string): Crumb[] {
  const theme = CHANNEL_THEME[channel];
  const label = channel === "social" ? "Social Planner" : theme.label;

  return [
    DASHBOARD,
    MARKETING,
    /* The channel's own landing page — Calendar for Social, Overview for the
       rest, since those are the pages their nav groups open on. */
    {
      label,
      href: channel === "social" ? `${theme.base}/calendar` : theme.base,
    },
    { label: page },
  ];
}

/** A trail for a page that sits directly under Marketing. */
export const marketingCrumbs = (page: string): Crumb[] => [
  DASHBOARD,
  MARKETING,
  { label: page },
];

/** Marketing Overview itself — the trail stops at the current page. */
export const OVERVIEW_CRUMBS: Crumb[] = [DASHBOARD, { label: "Marketing" }];
