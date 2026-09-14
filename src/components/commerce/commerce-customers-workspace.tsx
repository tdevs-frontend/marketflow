"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Repeat, Sparkles, UserPlus, Users, Wallet } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { AvatarLabel } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
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

/**
 * Commerce Customers — who bought from me?
 *
 * The single most important thing about this page is what it is *not*: a second
 * customer database. Every row is a projection of a contact that already exists
 * in the CRM, keyed by that contact's id, computed from the order book. A
 * contact appears here the moment they buy something and nothing is written
 * back — which is why "View full profile" can safely open the CRM record.
 *
 * Customer type is derived too. New, Repeat, VIP and Inactive are read off
 * order history against the thresholds in `CUSTOMER_RULES`; nobody assigns
 * them, so they cannot drift from what a customer actually did, and they are
 * not CRM tags competing with the segments a marketer maintains by hand.
 */

const ALL = "all";

type TypeView = typeof ALL | CustomerType;

const VIEWS: { value: TypeView; label: string }[] = [
  { value: ALL, label: "All" },
  ...CUSTOMER_TYPES.map((item) => ({ value: item.value as TypeView, label: item.label })),
];

export function CommerceCustomersWorkspace() {
  const [view, setView] = useState<TypeView>(ALL);
  const [search, setSearch] = useState("");
  const [productType, setProductType] = useState<string>(ALL);
  const [selected, setSelected] = useState<CommerceCustomer | null>(null);

  const totals = useMemo(() => customerTotals(), []);

  const kpis: CommerceKpi[] = [
    {
      label: "Total Customers",
      value: formatNumber(totals.total),
      icon: Users,
      tone: "brand",
      hint: "Contacts who have purchased",
    },
    {
      label: "New Customers",
      value: formatNumber(totals.new),
      icon: UserPlus,
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
      label: "Lifetime Revenue",
      value: formatCurrency(totals.lifetimeRevenue),
      icon: Wallet,
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
          <div className="mb-4 -mx-1 overflow-x-auto px-1">
            <SegmentedControl
              label="Filter customers by type"
              value={view}
              onChange={setView}
              options={VIEWS}
            />
          </div>

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

          <div className="mt-5">
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
                        className="tabular-nums whitespace-nowrap font-normal text-text-secondary"
                      >
                        {formatCurrency(customer.averageOrderValue)}
                      </TD>

                      <TD className="whitespace-nowrap font-normal text-text-secondary">
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
 * answers "who are they". The link at the bottom is what keeps the two joined —
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

              <p className="mt-1 text-sm text-text-secondary">
                {order.lines.map((line) => line.productName).join(", ")}
              </p>

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
        These figures are calculated from orders. Editing the person — their
        tags, consent or owner — happens on their contact record.
      </p>
    </Drawer>
  );
}
