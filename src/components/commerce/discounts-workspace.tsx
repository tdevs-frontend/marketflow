"use client";

import { useState } from "react";
import {
  BadgePercent,
  Check,
  CircleDollarSign,
  Copy,
  Megaphone,
  Pencil,
  Plus,
  Tag,
  Trash2,
  TrendingUp,
} from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Menu } from "@/components/ui/menu";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { APP_ROUTES } from "@/constants";
import {
  DISCOUNT_SCOPES,
  DISCOUNT_STATUSES,
  DISCOUNT_TYPES,
} from "@/constants/commerce";
import { CATEGORIES, DISCOUNTS, PRODUCTS } from "@/lib/commerce-fixtures";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  Discount,
  DiscountScope,
  DiscountStatus,
  DiscountType,
} from "@/types/commerce";
import { CommerceKpis, type CommerceKpi } from "./commerce-kpis";
import { DiscountStatusBadge } from "./commerce-badges";

function kpis(): CommerceKpi[] {
  const active = DISCOUNTS.filter((item) => item.status === "active");
  const redemptions = DISCOUNTS.reduce((sum, item) => sum + item.usageCount, 0);
  const given = DISCOUNTS.reduce((sum, item) => sum + item.discountGiven, 0);
  const revenue = DISCOUNTS.reduce((sum, item) => sum + item.revenueGenerated, 0);

  return [
    {
      label: "Active Discounts",
      value: formatNumber(active.length),
      icon: BadgePercent,
      tone: "brand",
      hint: `${DISCOUNTS.length} total`,
    },
    {
      label: "Total Redemptions",
      value: formatNumber(redemptions),
      icon: Tag,
    },
    {
      label: "Discount Given",
      value: formatCurrency(given),
      icon: CircleDollarSign,
      hint: "Cost of the offers",
    },
    {
      label: "Revenue Generated",
      value: formatCurrency(revenue),
      icon: TrendingUp,
      tone: "brand",
      /* The comparison that decides whether an offer was worth running. */
      hint: `${(revenue / Math.max(given, 1)).toFixed(1)}× return on discount`,
    },
  ];
}

function valueLabel(discount: Discount): string {
  if (discount.type === "percentage") return `${discount.value}%`;
  if (discount.type === "fixed") return formatCurrency(discount.value);
  return "Free shipping";
}

interface Draft {
  name: string;
  code: string;
  type: DiscountType;
  value: string;
  scope: DiscountScope;
  targetId: string;
  minimumPurchase: string;
  maximumDiscount: string;
  usageLimit: string;
  startsAt: string;
  endsAt: string;
  status: DiscountStatus;
}

const EMPTY: Draft = {
  name: "",
  code: "",
  type: "percentage",
  value: "",
  scope: "all",
  targetId: "",
  minimumPurchase: "",
  maximumDiscount: "",
  usageLimit: "",
  startsAt: "",
  endsAt: "",
  status: "draft",
};

export function DiscountsWorkspace() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      /* Clipboard may be blocked; the code is on screen regardless. */
    }
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = "Name the discount.";
    if (!draft.code.trim()) next.code = "Enter a coupon code.";
    if (draft.type !== "free-shipping" && !draft.value.trim()) {
      next.value = "Enter a discount value.";
    }
    if (draft.type === "percentage" && Number(draft.value) > 100) {
      next.value = "A percentage cannot exceed 100.";
    }
    if (draft.endsAt && draft.startsAt && draft.endsAt < draft.startsAt) {
      next.endsAt = "The end date is before the start date.";
    }
    setErrors(next);
    if (Object.keys(next).length === 0) setOpen(false);
  }

  return (
    <>
      <CommerceKpis items={kpis()} />

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base">All discounts</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Codes customers can redeem at checkout.
            </p>
          </div>
          <Button
            size="compact"
            onClick={() => {
              setDraft(EMPTY);
              setErrors({});
              setOpen(true);
            }}
          >
            <Plus aria-hidden />
            Create Discount
          </Button>
        </div>

        <div className="mt-4 max-lg:hidden">
          <Table minWidth="68rem">
            <THead>
              <TH>Code</TH>
              <TH>Name</TH>
              <TH>Type</TH>
              <TH align="right">Value</TH>
              <TH align="right">Usage</TH>
              <TH align="right">Limit</TH>
              <TH>Status</TH>
              <TH>Start</TH>
              <TH>End</TH>
              <TH align="right">Actions</TH>
            </THead>

            <TBody>
              {DISCOUNTS.map((discount) => (
                <TR key={discount.id}>
                  <TD>
                    <button
                      type="button"
                      onClick={() => copyCode(discount.code)}
                      className="inline-flex items-center gap-1.5 rounded-btn bg-surface-secondary px-2 py-1 font-mono text-xs font-medium text-text-primary transition-colors hover:bg-border focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      {discount.code}
                      {copiedCode === discount.code ? (
                        <Check className="size-3 text-primary" aria-hidden />
                      ) : (
                        <Copy className="size-3 text-text-muted" aria-hidden />
                      )}
                    </button>
                  </TD>

                  <TD className="font-medium text-text-primary">{discount.name}</TD>

                  <TD className="text-text-secondary">
                    {DISCOUNT_TYPES.find((item) => item.value === discount.type)?.label}
                  </TD>

                  <TD align="right" className="font-medium text-text-primary">
                    {valueLabel(discount)}
                  </TD>

                  <TD align="right" className="tabular-nums">
                    {formatNumber(discount.usageCount)}
                  </TD>

                  <TD align="right" className="text-text-muted tabular-nums">
                    {discount.usageLimit ? formatNumber(discount.usageLimit) : "∞"}
                  </TD>

                  <TD>
                    <DiscountStatusBadge status={discount.status} />
                  </TD>

                  <TD className="text-xs whitespace-nowrap text-text-muted">
                    {formatDate(discount.startsAt)}
                  </TD>

                  <TD className="text-xs whitespace-nowrap text-text-muted">
                    {discount.endsAt ? formatDate(discount.endsAt) : "No end date"}
                  </TD>

                  <TD align="right">
                    <Menu
                      label={`Actions for ${discount.code}`}
                      items={[
                        {
                          label: "Edit discount",
                          icon: <Pencil className="size-4" />,
                          onSelect: () => {},
                        },
                        {
                          label: "Use in campaign",
                          icon: <Megaphone className="size-4" />,
                          onSelect: () => {},
                        },
                        {
                          label: "Duplicate",
                          icon: <Copy className="size-4" />,
                          onSelect: () => {},
                        },
                        {
                          label: "Delete",
                          icon: <Trash2 className="size-4" />,
                          onSelect: () => {},
                          destructive: true,
                        },
                      ]}
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>

        <ul className="mt-4 space-y-2.5 lg:hidden">
          {DISCOUNTS.map((discount) => {
            const used = discount.usageLimit
              ? Math.min(100, (discount.usageCount / discount.usageLimit) * 100)
              : 0;

            return (
              <li
                key={discount.id}
                className="rounded-panel border border-border p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-block rounded-btn bg-surface-secondary px-2 py-1 font-mono text-xs font-medium text-text-primary">
                      {discount.code}
                    </span>
                    <p className="mt-1.5 truncate text-sm font-medium text-text-primary">
                      {discount.name}
                    </p>
                  </div>
                  <DiscountStatusBadge status={discount.status} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold text-text-primary">
                    {valueLabel(discount)}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatNumber(discount.usageCount)}
                    {discount.usageLimit
                      ? ` / ${formatNumber(discount.usageLimit)}`
                      : ""}{" "}
                    used
                  </span>
                </div>

                {discount.usageLimit ? (
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-secondary">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        used > 85 ? "bg-warning" : "bg-primary",
                      )}
                      style={{ width: `${used}%` }}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base">Put a code to work</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Attach a discount to a campaign or send it to a WhatsApp segment.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink href={APP_ROUTES.whatsapp} variant="outline" size="compact">
            Send on WhatsApp
          </ButtonLink>
          <ButtonLink href={APP_ROUTES.campaigns} variant="secondary" size="compact">
            <Megaphone aria-hidden />
            Use in campaign
          </ButtonLink>
        </div>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Create discount"
        description="Set the offer, who it applies to, and when it runs."
        size="lg"
        footer={
          <>
            <Button variant="outline" size="compact" onClick={() => setOpen(false)}>
              Save Draft
            </Button>
            <Button size="compact" onClick={validate}>
              Create Discount
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Discount Name" htmlFor="dsc-name" error={errors.name}>
              <Input
                id="dsc-name"
                value={draft.name}
                error={Boolean(errors.name)}
                placeholder="Summer Sale 20%"
                className="h-11"
                onChange={(event) => set("name", event.target.value)}
              />
            </Field>

            <Field
              label="Coupon Code"
              htmlFor="dsc-code"
              error={errors.code}
              hint="Customers type this at checkout."
            >
              <Input
                id="dsc-code"
                value={draft.code}
                error={Boolean(errors.code)}
                placeholder="SUMMER20"
                className="h-11 font-mono"
                onChange={(event) => set("code", event.target.value.toUpperCase())}
              />
            </Field>

            <Field label="Discount Type" htmlFor="dsc-type">
              <Select
                id="dsc-type"
                value={draft.type}
                className="h-11"
                onChange={(event) => set("type", event.target.value as DiscountType)}
              >
                {DISCOUNT_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label={draft.type === "percentage" ? "Discount Value (%)" : "Discount Value"}
              htmlFor="dsc-value"
              error={errors.value}
            >
              <Input
                id="dsc-value"
                type="number"
                inputMode="decimal"
                min={0}
                value={draft.value}
                error={Boolean(errors.value)}
                disabled={draft.type === "free-shipping"}
                placeholder={draft.type === "percentage" ? "20" : "25"}
                className="h-11"
                onChange={(event) => set("value", event.target.value)}
              />
            </Field>
          </div>

          <Field label="Applies To" htmlFor="dsc-scope">
            <Select
              id="dsc-scope"
              value={draft.scope}
              className="h-11"
              onChange={(event) => {
                set("scope", event.target.value as DiscountScope);
                set("targetId", "");
              }}
            >
              {DISCOUNT_SCOPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          {/* Only asked for once the scope needs it. */}
          {draft.scope !== "all" ? (
            <Field
              label={draft.scope === "products" ? "Product" : "Category"}
              htmlFor="dsc-target"
            >
              <Select
                id="dsc-target"
                value={draft.targetId}
                className="h-11"
                onChange={(event) => set("targetId", event.target.value)}
              >
                <option value="">Select…</option>
                {(draft.scope === "products" ? PRODUCTS : CATEGORIES).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Minimum Purchase" htmlFor="dsc-min">
              <Input
                id="dsc-min"
                type="number"
                inputMode="decimal"
                min={0}
                value={draft.minimumPurchase}
                placeholder="100"
                className="h-11"
                onChange={(event) => set("minimumPurchase", event.target.value)}
              />
            </Field>

            <Field label="Maximum Discount" htmlFor="dsc-max">
              <Input
                id="dsc-max"
                type="number"
                inputMode="decimal"
                min={0}
                value={draft.maximumDiscount}
                placeholder="60"
                className="h-11"
                onChange={(event) => set("maximumDiscount", event.target.value)}
              />
            </Field>

            <Field label="Usage Limit" htmlFor="dsc-limit" hint="Blank for unlimited.">
              <Input
                id="dsc-limit"
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.usageLimit}
                placeholder="500"
                className="h-11"
                onChange={(event) => set("usageLimit", event.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Start Date" htmlFor="dsc-start">
              <Input
                id="dsc-start"
                type="date"
                value={draft.startsAt}
                className="h-11"
                onChange={(event) => set("startsAt", event.target.value)}
              />
            </Field>

            <Field label="End Date" htmlFor="dsc-end" error={errors.endsAt}>
              <Input
                id="dsc-end"
                type="date"
                value={draft.endsAt}
                error={Boolean(errors.endsAt)}
                className="h-11"
                onChange={(event) => set("endsAt", event.target.value)}
              />
            </Field>

            <Field label="Status" htmlFor="dsc-status">
              <Select
                id="dsc-status"
                value={draft.status}
                className="h-11"
                onChange={(event) =>
                  set("status", event.target.value as DiscountStatus)
                }
              >
                {DISCOUNT_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </Dialog>
    </>
  );
}
