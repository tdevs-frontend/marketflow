"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Copy,
  Eye,
  Megaphone,
  Package,
  PackageX,
  Pencil,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import Link from "next/link";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
import { Menu } from "@/components/ui/menu";
import { Pagination } from "@/components/ui/pagination";
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
import { PRODUCTS_PER_PAGE, PRODUCT_STATUSES, STOCK_STATUSES } from "@/constants/commerce";
import { CATEGORIES, PRODUCTS, stockStatusOf } from "@/lib/commerce-fixtures";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product, ProductStatus, StockStatus } from "@/types/commerce";
import { CommerceKpis, type CommerceKpi } from "./commerce-kpis";
import {
  ProductStatusBadge,
  ProductThumb,
  ProductTypeLabel,
  StockBadge,
} from "./commerce-badges";
import { FilterBar } from "./filter-bar";

type SortField = "name" | "price" | "stock" | "updatedAt";

const ALL = "all";

/* -------------------------------------------------------------------------- */
/* KPIs                                                                       */
/* -------------------------------------------------------------------------- */

function kpis(): CommerceKpi[] {
  const active = PRODUCTS.filter((item) => item.status === "active");
  const low = PRODUCTS.filter(
    (item) =>
      item.trackInventory &&
      stockStatusOf(item.stock, item.lowStockThreshold) === "low-stock",
  );
  const out = PRODUCTS.filter(
    (item) =>
      item.trackInventory &&
      stockStatusOf(item.stock, item.lowStockThreshold) === "out-of-stock",
  );

  return [
    {
      label: "Total Products",
      value: formatNumber(PRODUCTS.length),
      icon: Package,
      hint: `${CATEGORIES.length} categories`,
    },
    {
      label: "Active Products",
      value: formatNumber(active.length),
      icon: CheckCircle2,
      tone: "brand",
      hint: "Visible to customers",
    },
    {
      label: "Low Stock",
      value: formatNumber(low.length),
      icon: TriangleAlert,
      tone: low.length ? "warning" : "neutral",
      hint: "At or below threshold",
    },
    {
      label: "Out of Stock",
      value: formatNumber(out.length),
      icon: PackageX,
      tone: out.length ? "danger" : "neutral",
      hint: "Needs restocking",
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Workspace                                                                  */
/* -------------------------------------------------------------------------- */

export function ProductsWorkspace() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [status, setStatus] = useState<ProductStatus | typeof ALL>(ALL);
  const [stock, setStock] = useState<StockStatus | typeof ALL>(ALL);

  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const activeFilters =
    (category === ALL ? 0 : 1) + (status === ALL ? 0 : 1) + (stock === ALL ? 0 : 1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = PRODUCTS.filter((item) => {
      if (
        term &&
        !item.name.toLowerCase().includes(term) &&
        !item.sku.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (category !== ALL && item.categoryId !== category) return false;
      if (status !== ALL && item.status !== status) return false;
      if (
        stock !== ALL &&
        stockStatusOf(item.stock, item.lowStockThreshold) !== stock
      ) {
        return false;
      }
      return true;
    });

    const factor = direction === "asc" ? 1 : -1;
    return rows.sort((a, b) => {
      if (sortField === "name") return a.name.localeCompare(b.name) * factor;
      if (sortField === "price") return (a.price - b.price) * factor;
      if (sortField === "stock") return (a.stock - b.stock) * factor;
      return (
        (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * factor
      );
    });
  }, [search, category, status, stock, sortField, direction]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice(
    (current - 1) * PRODUCTS_PER_PAGE,
    current * PRODUCTS_PER_PAGE,
  );

  /* Selection is scoped to the visible page — a select-all that silently
     picked up filtered-out rows would be a nasty surprise on bulk delete. */
  const pageIds = rows.map((item) => item.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const someOnPage = pageIds.some((id) => selected.includes(id));

  function toggleAll() {
    setSelected((prev) =>
      allOnPage
        ? prev.filter((id) => !pageIds.includes(id))
        : [...new Set([...prev, ...pageIds])],
    );
  }

  function toggleOne(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  function onSort(field: SortField) {
    if (field === sortField) {
      setDirection((value) => (value === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setDirection(field === "name" ? "asc" : "desc");
    }
  }

  function resetFilters() {
    setCategory(ALL);
    setStatus(ALL);
    setStock(ALL);
    setPage(1);
  }

  const editHref = (id: string) => `${APP_ROUTES.products}/${id}/edit`;

  /* Navigation is real; the writes stop at the mutations in `commerceApi`. */
  const rowActions = (item: Product) => [
    {
      label: "View product",
      icon: <Eye className="size-4" />,
      onSelect: () => router.push(editHref(item.id)),
    },
    {
      label: "Edit product",
      icon: <Pencil className="size-4" />,
      onSelect: () => router.push(editHref(item.id)),
    },
    {
      label: "Duplicate",
      icon: <Copy className="size-4" />,
      onSelect: () => router.push(`${APP_ROUTES.products}/new`),
    },
    {
      label: "Promote in campaign",
      icon: <Megaphone className="size-4" />,
      onSelect: () => router.push(APP_ROUTES.campaigns),
    },
    {
      label: item.status === "archived" ? "Restore" : "Archive",
      icon: <Archive className="size-4" />,
      onSelect: () => {},
    },
    {
      label: "Delete",
      icon: <Trash2 className="size-4" />,
      onSelect: () => {},
      destructive: true,
    },
  ];

  return (
    <>
      <CommerceKpis items={kpis()} />

      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search products or SKU…"
          activeCount={activeFilters}
          onReset={resetFilters}
        >
          <Select
            aria-label="Filter by category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="h-10 w-full lg:w-44"
          >
            <option value={ALL}>All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ProductStatus | typeof ALL);
              setPage(1);
            }}
            className="h-10 w-full lg:w-36"
          >
            <option value={ALL}>All statuses</option>
            {PRODUCT_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by stock"
            value={stock}
            onChange={(event) => {
              setStock(event.target.value as StockStatus | typeof ALL);
              setPage(1);
            }}
            className="h-10 w-full lg:w-40"
          >
            <option value={ALL}>All stock levels</option>
            {STOCK_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </FilterBar>

        {selected.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-panel border border-primary-border bg-primary-soft px-3.5 py-2.5">
            <p className="text-sm font-medium text-primary-dark">
              {selected.length} selected
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm">
                <CheckCircle2 aria-hidden />
                Activate
              </Button>
              <Button variant="outline" size="sm">
                <Archive aria-hidden />
                Archive
              </Button>
              <Button variant="danger" size="sm">
                <Trash2 aria-hidden />
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
                Clear
              </Button>
            </div>
          </div>
        ) : null}

        {rows.length === 0 ? (
          <EmptyState
            title="No products match those filters"
            description="Try a different search term, or clear the filters to see everything."
            action={
              <Button size="sm" variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop: table. */}
            <div className="mt-4 max-lg:hidden">
              <Table minWidth="64rem">
                <THead>
                  <TH className="w-10 pr-0">
                    <Checkbox
                      checked={allOnPage}
                      indeterminate={!allOnPage && someOnPage}
                      onChange={toggleAll}
                      aria-label="Select all products on this page"
                    />
                  </TH>
                  <SortableTH
                    field="name"
                    activeField={sortField}
                    direction={direction}
                    onSort={onSort}
                  >
                    Product
                  </SortableTH>
                  <TH>Category</TH>
                  <TH>SKU</TH>
                  <SortableTH
                    field="price"
                    activeField={sortField}
                    direction={direction}
                    onSort={onSort}
                    align="right"
                  >
                    Price
                  </SortableTH>
                  <SortableTH
                    field="stock"
                    activeField={sortField}
                    direction={direction}
                    onSort={onSort}
                    align="right"
                  >
                    Stock
                  </SortableTH>
                  <TH>Status</TH>
                  <SortableTH
                    field="updatedAt"
                    activeField={sortField}
                    direction={direction}
                    onSort={onSort}
                  >
                    Updated
                  </SortableTH>
                  <TH align="right">Actions</TH>
                </THead>

                <TBody>
                  {rows.map((item) => {
                    const stockState = stockStatusOf(item.stock, item.lowStockThreshold);

                    return (
                      <TR key={item.id} selected={selected.includes(item.id)}>
                        <TD className="pr-0">
                          <Checkbox
                            checked={selected.includes(item.id)}
                            onChange={() => toggleOne(item.id)}
                            aria-label={`Select ${item.name}`}
                          />
                        </TD>

                        <TD>
                          <div className="flex items-center gap-3">
                            <ProductThumb />
                            <div className="min-w-0">
                              <Link
                                href={editHref(item.id)}
                                className="block truncate font-medium text-text-primary transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                              >
                                {item.name}
                              </Link>
                              <ProductTypeLabel type={item.type} />
                            </div>
                          </div>
                        </TD>

                        <TD className="text-text-secondary">{item.categoryName}</TD>
                        <TD className="font-mono text-xs text-text-muted">{item.sku}</TD>

                        <TD align="right">
                          {item.salePrice ? (
                            <span className="whitespace-nowrap">
                              <span className="font-medium text-text-primary">
                                {formatCurrency(item.salePrice)}
                              </span>{" "}
                              <s className="text-xs text-text-muted">
                                {formatCurrency(item.price)}
                              </s>
                            </span>
                          ) : (
                            <span className="font-medium text-text-primary">
                              {formatCurrency(item.price)}
                            </span>
                          )}
                        </TD>

                        <TD align="right">
                          {item.trackInventory ? (
                            <span
                              className={cn(
                                "font-medium tabular-nums",
                                stockState === "out-of-stock"
                                  ? "text-error"
                                  : stockState === "low-stock"
                                    ? "text-warning-text"
                                    : "text-text-primary",
                              )}
                            >
                              {item.stock}
                            </span>
                          ) : (
                            <span className="text-xs text-text-muted">Untracked</span>
                          )}
                        </TD>

                        <TD>
                          <div className="flex flex-col items-start gap-1">
                            <ProductStatusBadge status={item.status} />
                            {item.trackInventory ? (
                              <StockBadge status={stockState} />
                            ) : null}
                          </div>
                        </TD>

                        <TD className="text-xs whitespace-nowrap text-text-muted">
                          {formatDate(item.updatedAt)}
                        </TD>

                        <TD align="right">
                          <Menu
                            items={rowActions(item)}
                            label={`Actions for ${item.name}`}
                          />
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>

            {/* Mobile: the same rows as cards. */}
            <ul className="mt-4 space-y-2.5 lg:hidden">
              {rows.map((item) => {
                const stockState = stockStatusOf(item.stock, item.lowStockThreshold);

                return (
                  <li
                    key={item.id}
                    className="rounded-panel border border-border p-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selected.includes(item.id)}
                        onChange={() => toggleOne(item.id)}
                        aria-label={`Select ${item.name}`}
                        className="mt-1"
                      />
                      <ProductThumb />

                      <div className="min-w-0 flex-1">
                        <Link
                          href={editHref(item.id)}
                          className="block truncate text-sm font-medium text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-0.5 font-mono text-[11px] text-text-muted">
                          {item.sku} · {item.categoryName}
                        </p>
                      </div>

                      <Menu items={rowActions(item)} label={`Actions for ${item.name}`} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <ProductStatusBadge status={item.status} />
                        {item.trackInventory ? (
                          <StockBadge status={stockState} />
                        ) : null}
                      </div>
                      <p className="text-sm font-bold text-text-primary">
                        {formatCurrency(item.salePrice ?? item.price)}
                        {item.trackInventory ? (
                          <span className="ml-2 text-xs font-medium text-text-muted">
                            {item.stock} in stock
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4">
              <Pagination
                page={current}
                totalPages={totalPages}
                total={filtered.length}
                perPage={PRODUCTS_PER_PAGE}
                onChange={setPage}
                noun="products"
              />
            </div>
          </>
        )}
      </Card>

      {/* Cross-link out of Commerce and back into marketing. */}
      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base">Turn products into orders</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Share a catalog on WhatsApp, or build a campaign around your best
            sellers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink href={APP_ROUTES.catalog} variant="outline" size="compact">
            Open catalog
          </ButtonLink>
          <ButtonLink href={APP_ROUTES.campaigns} variant="secondary" size="compact">
            <Megaphone aria-hidden />
            Create campaign
          </ButtonLink>
        </div>
      </Card>
    </>
  );
}
