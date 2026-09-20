"use client";

import { useId } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabPanel, type TabItem } from "@/components/ui/tabs";
import { APP_ROUTES } from "@/constants/app";
import {
  permissionHint,
  useWorkspacePermissions,
} from "@/components/workspace/use-workspace-permissions";

import { BillingContact } from "./billing-contact";
import { CurrentSubscription, PlanUsage } from "./current-subscription";
import { InvoiceList } from "./invoice-list";
import { PaymentMethod } from "./payment-method";
import { PlanHistory } from "./plan-history";
import { PlansAndPricing } from "./plans-pricing";

/**
 * Billing & Subscription — three tabs, and the split between them is the point.
 *
 *   **Billing Information** is the standing record: what this workspace is on,
 *   what it is used against, what would be charged, who the invoice is
 *   addressed to and what has been charged before. Dashboard design throughout
 *   — the same cards, rules and spacing as every other Settings page.
 *
 *   **Plans & Pricing** is what else is available, and renders the *actual
 *   pricing page component* — `PricingPlans`, the same module `/pricing`, the
 *   homepage and the merchant overview compose. Not a copy of it: the same
 *   file. Choosing a tier there starts the checkout rather than switching the
 *   plan, because a change of tier is a change of what is charged.
 *
 *   **Plan History** is the ledger: one row per billed period, newest first. A
 *   tab rather than a card beside the pricing grid, because "what could I move
 *   to" and "what have I been paying" are opposite questions, and a history
 *   panel wedged next to four pricing cards competes with the decision those
 *   cards exist to support.
 *
 * Which is why the pricing tab deliberately does *not* share a card style with
 * the other two. It is supposed to feel like the pricing page opened inside the
 * dashboard — featured tier, gradient rule, Most popular badge, the same
 * billing toggle, the same buttons — while Billing Information and Plan History
 * are supposed to feel like settings. Flattening the tiers into dashboard cards
 * would have been the easy mistake.
 *
 * What is honest here, and what is not, is the module's organising rule:
 *
 *   **Real.** The plan, its price, the renewal date, the usage, the plan
 *   history and the invoice records. The tiers come from `constants/pricing`,
 *   so there is one answer to what MarketFlow costs; every usage figure is
 *   counted from this workspace — contacts are rows in the CRM, message counts
 *   are summed from what campaigns sent. A merchant checks a usage meter
 *   against their own knowledge of the business, and a hand-written number is
 *   the one they catch.
 *
 *   **Real, and pending.** A manual payment. The checkout records what a
 *   merchant says they sent and marks it awaiting verification; the plan does
 *   not start until somebody agrees the money arrived. That is the one path
 *   through the checkout that completes in this build, and it completes as a
 *   claim rather than as a settlement.
 *
 *   **Not real, and shown as such.** Card payment, the stored payment method,
 *   and the invoice documents. No payment provider is integrated, so the
 *   automatic methods are listed as *not connected* and the checkout stops at
 *   that boundary rather than crossing it. A card ending in 4242 would be the
 *   most expensive fiction in the product — somebody who believes a card is on
 *   file believes their service cannot lapse.
 *
 * The billing contact is none of those: it is the workspace's own business
 * record, which Workspace Settings owns. It is shown here read-only with a
 * link, because a second editor for a legal name is a question about which
 * screen is telling the truth.
 */

/* -------------------------------------------------------------------------- */
/* Tabs                                                                       */
/* -------------------------------------------------------------------------- */

type BillingTab = "billing" | "plans" | "history";

const TABS: TabItem<BillingTab>[] = [
  { value: "billing", label: "Billing Information" },
  { value: "plans", label: "Plans & Pricing" },
  { value: "history", label: "Plan History" },
];

/** `?tab=` is anybody's to type, so it is checked against the strip itself. */
const isBillingTab = (value: string | null): value is BillingTab =>
  TABS.some((item) => item.value === value);

export function BillingSettings() {
  const router = useRouter();
  const params = useSearchParams();
  const idBase = useId();

  const permissions = useWorkspacePermissions();

  const canView = permissions.can("billing", "view");
  const canManage = permissions.can("billing", "manage");

  /*
   * The tab lives in the URL, so "here is our billing", "here are the plans"
   * and "here is what we have paid" are three links somebody can send.
   *
   * Validated against `TABS` rather than compared to one string, so `?tab=`
   * anything unrecognised falls back to Billing Information instead of
   * rendering an empty panel. The default drops the parameter rather than
   * writing `?tab=billing`, so the clean URL and the explicit one land in the
   * same place.
   */
  const requested = params.get("tab");
  const tab: BillingTab = isBillingTab(requested) ? requested : "billing";

  /*
   * `push`, not `replace`. Each tab is a place the merchant navigated to, and
   * Back should return them to the one they came from — a merchant who opens
   * Plans from Billing Information and presses Back means "put the billing
   * details back", not "leave Settings". The cost is that Back walks the strip
   * before it leaves the page, which is the correct trade for a three-tab
   * module people move between while comparing.
   */
  const setTab = (value: BillingTab) => {
    const next = new URLSearchParams(params.toString());
    if (value === "billing") next.delete("tab");
    else next.set("tab", value);

    const query = next.toString();
    const base = APP_ROUTES.settingsBilling;
    router.push(query ? `${base}?${query}` : base, { scroll: false });
  };

  if (!canView) {
    return (
      <>
        <PageHeader
          title="Billing & Subscription"
          description="Manage your subscription, billing information and available plans."
        />
        <Card>
          <EmptyState
            title="Billing is not visible to your role"
            description={permissionHint("access to billing", permissions.roleName)}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Billing & Subscription"
        description="Manage your subscription, billing information and available plans."
      />

      {/* `bleed={false}`: the strip sits on the page, not inside a card, and
          the −20px pull is measured against a `CardBody`'s padding. */}
      <Tabs
        tabs={TABS}
        value={tab}
        onChange={setTab}
        label="Billing sections"
        idBase={idBase}
        bleed={false}
      />

      {tab === "billing" ? (
        <TabPanel idBase={idBase} value="billing" className="space-y-6">
          <CurrentSubscription
            canManage={canManage}
            onManagePlan={() => setTab("plans")}
          />
          <PlanUsage />
          <PaymentMethod canManage={canManage} />
          <BillingContact />
          <InvoiceList />
        </TabPanel>
      ) : tab === "plans" ? (
        <TabPanel idBase={idBase} value="plans" className="space-y-6">
          <PlansAndPricing
            canManage={canManage}
            onViewBilling={() => setTab("billing")}
          />
        </TabPanel>
      ) : (
        <TabPanel idBase={idBase} value="history" className="space-y-6">
          <PlanHistory />
        </TabPanel>
      )}
    </>
  );
}
