"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Crown,
  Repeat,
  Sparkles,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { AvatarLabel } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { panelId, tabId } from "@/components/ui/tabs";
import { APP_ROUTES } from "@/constants/app";
import { CUSTOMER_TYPES, PRODUCT_TYPE_LABEL } from "@/constants/commerce";
import { formatCurrency, formatDate, formatNumber, formatRelativeTime } from "@/lib/format";
import {
  COMMERCE_CUSTOMERS,
  COMMERCE_NOW_MS,
  customerTotals,
  ordersForCustomer,
} from "@/lib/commerce-fixtures";
import type { CommerceCustomer, CustomerType, ProductType } from "@/types/commerce";
import { CommerceKpis, type CommerceKpi } from "./commerce-kpis";
import { CustomerTypeBadge, OrderStatusBadge } from "./commerce-badges";
import { FilterBar } from "./filter-bar";
import { FilterTabs, type FilterTab } from "./filter-tabs";

/**
 * Commerce Customers - who bought from me?
 *
 * The single most important thing about this page is what it is *not*: a second
 * customer database. Every row is a projection of a contact that already exists
 * in the CRM, keyed by that contact's id, computed from the order book. A
 * contact appears here the moment they buy something and nothing is written
 * back - which is why "View full profile" can safely open the CRM record.
 *
 * Customer type is derived too. New, Repeat, VIP and Inactive are read off
 * order history against the thresholds in `CUSTOMER_RULES`; nobody assigns
 * them, so they cannot drift from what a customer actually did, and they are
 * not CRM tags competing with the segments a marketer maintains by hand.
 */

const ALL = "all";

type TypeView = typeof ALL | CustomerType;

/* One mark per behaviour: a crown for the biggest spenders, a departing
   figure for the ones who stopped. The labels come from `CUSTOMER_TYPES` so
   the tab and the badge in the table always read the same word. */
const VIEW_ICON: Record<string, FilterTab["icon"]> = {
  [ALL]: Users,
  new: UserPlus,
  repeat: Repeat,
  vip: Crown,
  inactive: UserMinus,
};

const VIEWS: { value: TypeView; label: string }[] = [
  { value: ALL, label: "All" },
  ...CUSTOMER_TYPES.map((item) => ({ value: item.value as TypeView, label: item.label })),
];

export function CommerceCustomersWorkspace() {
  const [view, setView] = useState<TypeView>(ALL);
  const [search, setSearch] = useState("");
  const [productType, setProductType] = useState<string>(ALL);
  const [selected, setSelected] = useState<CommerceCustomer | null>(null);

  const idBase = useId();
  const totals = useMemo(() => customerTotals(), []);

  /*
   * Counted over every buyer, not the filtered set - the tabs describe the
   * customer base, and a search for one name should not make them read zero.
   *
   * Not `customerTotals`: that folds VIP into repeat for the KPI row, which
   * is right there and wrong here, where VIP is a tab of its own.
   */
  const viewCounts = useMemo(() => {
    const byType = (type: string) =>
      COMMERCE_CUSTOMERS.filter((item) => item.customerType === type).length;

    return {
      [ALL]: COMMERCE_CUSTOMERS.length,
      new: byType("new"),
      repeat: byType("repeat"),
      vip: byType("vip"),
      inactive: byType("inactive"),
    } as Record<string, number>;
  }, []);

  const kpis: CommerceKpi[] = [
    {
      label: "Total Customers",
      value: formatNumber(totals.total),
      icon: Users,
      tone: "brand",
      hint: "Contacts who have purchased",
    },
    {
      /* Blue for the newest cohort, so it is not the same grey as Lifetime
         Revenue two cards along. */
      label: "New Customers",
      value: formatNumber(totals.new),
      icon: UserPlus,
      tone: "info",
      hint: "First purchase only",
    },
    {
      label: "Repeat Customers",
      value: formatNumber(totals.repeat),
      icon: Repeat,
      tone: "success",
      hint: "Bought more than once",
    },
    {
      /* Violet, not the indigo of Total Customers: the row's two headline
         figures are a count and a sum, and they should not read alike. */
      label: "Lifetime Revenue",
      value: formatCurrency(totals.lifetimeRevenue),
      icon: Wallet,
      tone: "sms",
      hint: "Across every order",
    },
  ];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return COMMERCE_CUSTOMERS.filter((customer) => {
      if (view !== ALL && customer.customerType !== view) return false;
      if (
        productType !== ALL &&
        !customer.purchasedTypes.includes(productType as ProductType)
      ) {
        return false;
      }
      if (term) {
        const haystack = [customer.name, customer.email ?? "", customer.topProductName]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [view, search, productType]);

  return (
    <>
      <PageHeader
        title="Customers"
        description="View customers who have purchased products or services from your business."
        secondaryActions={
          /* The seam back to the one contact database. Commerce is a reading of
             it, not a replacement for it, and saying so in the header stops a
             merchant hunting for "the other customer list". */
          <ButtonLink href={APP_ROUTES.contacts} variant="outline">
            All Contacts
          </ButtonLink>
        }
      />

      <CommerceKpis items={kpis} />

      {COMMERCE_CUSTOMERS.length === 0 ? (
        <EmptyState
          title="No paying customers yet"
          description="Contacts appear here automatically once they place their first order."
          action={
            <ButtonLink href={APP_ROUTES.contacts} size="sm">
              View contacts
            </ButtonLink>
          }
        />
      ) : (
        <Card className="p-5">
          <FilterTabs
            className="-mx-5 mb-5 px-5"
            idBase={idBase}
            activeTab={view}
            tabs={VIEWS.map((item) => ({
              id: item.value,
              label: item.label,
              count: viewCounts[item.value] ?? 0,
              icon: VIEW_ICON[item.value],
            }))}
            onTabChange={(next) => setView(next as TypeView)}
          />

          <FilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search name, email or product…"
            activeCount={productType === ALL ? 0 : 1}
            onReset={() => {
              setSearch("");
              setProductType(ALL);
            }}
          >
            <Select
              label="Purchased type"
              size="sm"
              value={productType}
              onChange={setProductType}
              options={[
                { value: ALL, label: "All purchases" },
                { value: "physical", label: "Bought physical" },
                { value: "digital", label: "Bought digital" },
                { value: "service", label: "Booked a service" },
              ]}
              className="lg:w-44"
            />
          </FilterBar>

          <div
            className="mt-5"
            id={panelId(idBase, "list")}
            role="tabpanel"
            aria-labelledby={tabId(idBase, view)}
          >
            {filtered.length === 0 ? (
              <EmptyState
                compact
                title="No customers match"
                description="Nothing here fits that search and filter."
              />
            ) : (
              <Table minWidth="68rem">
                <THead>
                  <TH>Customer</TH>
                  <TH align="right">Orders</TH>
                  <TH align="right">Total Spent</TH>
                  <TH align="right">AOV</TH>
                  <TH>Last Purchase</TH>
                  <TH>Top Product / Service</TH>
                  <TH>Customer Type</TH>
                  <TH align="right">
                    <span className="sr-only">Open</span>
                  </TH>
                </THead>

                <TBody>
                  {filtered.map((customer) => (
                    <TR
                      key={customer.contactId}
                      onClick={() => setSelected(customer)}
                      className="cursor-pointer"
                    >
                      <TD className="max-w-56">
                        <AvatarLabel
                          name={customer.name}
                          secondary={customer.email}
                          size="sm"
                        />
                      </TD>

                      <TD align="right" className="tabular-nums">
                        {customer.orders}
                      </TD>

                      <TD align="right" className="tabular-nums whitespace-nowrap">
                        {formatCurrency(customer.totalSpent)}
                      </TD>

                      <TD
                        align="right"
                        className="tabular-nums whitespace-nowrap text-text-secondary"
                      >
                        {formatCurrency(customer.averageOrderValue)}
                      </TD>

                      <TD className="whitespace-nowrap text-text-secondary">
                        {formatRelativeTime(customer.lastPurchaseAt, COMMERCE_NOW_MS)}
                      </TD>

                      <TD className="max-w-48">
                        <span className="block truncate font-normal text-text-secondary">
                          {customer.topProductName}
                        </span>
                      </TD>

                      <TD>
                        <CustomerTypeBadge type={customer.customerType} />
                      </TD>

                      <TD align="right">
                        <ChevronRight
                          className="inline size-4 text-text-muted"
                          aria-hidden
                        />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        </Card>
      )}

      <CustomerDrawer
        customer={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

/**
 * One buyer's commerce history.
 *
 * A commerce-shaped drawer rather than the CRM contact drawer, because the
 * question being asked here is "what have they bought" and the CRM record
 * answers "who are they". The link at the bottom is what keeps the two joined -
 * one contact, two readings of it.
 */
function CustomerDrawer({
  customer,
  open,
  onClose,
}: {
  customer: CommerceCustomer | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!customer) return null;

  const orders = ordersForCustomer(customer.contactId);

  const facts = [
    { label: "Orders", value: String(customer.orders) },
    { label: "Total spent", value: formatCurrency(customer.totalSpent) },
    { label: "Average order", value: formatCurrency(customer.averageOrderValue) },
    { label: "Customer since", value: formatDate(customer.firstPurchaseAt) },
    {
      label: "Last purchase",
      value: formatRelativeTime(customer.lastPurchaseAt, COMMERCE_NOW_MS),
    },
    { label: "Top product", value: customer.topProductName },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={customer.name}
      description={customer.email ?? "No email on file"}
      footer={
        <ButtonLink
          href={APP_ROUTES.contacts}
          variant="outline"
          size="compact"
          className="w-full"
        >
          View Full Contact Profile
        </ButtonLink>
      }
    >
      <div className="flex items-center justify-between gap-3">
        <AvatarLabel
          name={customer.name}
          secondary={customer.whatsappNumber ?? customer.email}
          size="md"
        />
        <CustomerTypeBadge type={customer.customerType} />
      </div>

      <dl className="mt-5 space-y-3">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="flex items-baseline justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <dt className="shrink-0 text-sm text-text-muted">{fact.label}</dt>
            <dd className="min-w-0 truncate text-sm font-medium text-text-primary">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-text-primary">What they buy</h3>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {customer.purchasedTypes.map((type) => (
            <li
              key={type}
              className="rounded-btn bg-surface-secondary px-2 py-0.5 text-sm font-medium text-text-secondary"
            >
              {PRODUCT_TYPE_LABEL[type]}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-text-primary">Purchase timeline</h3>

        <ul className="mt-2.5 divide-y divide-border">
          {orders.map((order) => (
            <li key={order.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={APP_ROUTES.orders}
                  className="font-mono text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:shadow-focus focus-visible:outline-none"
                >
                  {order.reference}
                </Link>
                <span className="text-sm font-bold text-text-primary tabular-nums">
                  {formatCurrency(order.total)}
                </span>
              </div>

              {/*
                * What they actually bought, variant included.
                *
                * A history that reads "Premium T-Shirt" three times cannot
                * answer the one question this panel is opened for - what size
                * to offer them next - so the line names the combination the
                * order recorded.
                */}
              <ul className="mt-1 space-y-0.5">
                {order.lines.map((line) => (
                  <li
                    key={`${line.productId}-${line.variantId ?? "base"}`}
                    className="text-sm font-medium text-text-secondary"
                  >
                    {line.productName}
                    {line.variantName ? (
                      <span className="text-text-muted">
                        {" · "}
                        {line.variantName}
                      </span>
                    ) : null}
                    {line.quantity > 1 ? (
                      <span className="text-text-muted"> × {line.quantity}</span>
                    ) : null}
                  </li>
                ))}
              </ul>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <span className="text-meta text-text-muted">
                  {formatRelativeTime(order.placedAt, COMMERCE_NOW_MS)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-5 flex items-start gap-2 rounded-panel border border-border bg-surface-secondary px-3.5 py-3 text-sm text-text-secondary">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-text-muted" aria-hidden />
        These figures are calculated from orders. Editing the person - their
        tags, consent or owner - happens on their contact record.
      </p>
    </Drawer>
  );
}
