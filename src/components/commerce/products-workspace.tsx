"use client";

import { useRouter } from "next/navigation";
import { useCallback, useId, useMemo, useState } from "react";
import {
  Archive,
  Briefcase,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileDown,
  FileEdit,
  Layers,
  Megaphone,
  Package,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Warehouse,
} from "lucide-react";

import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
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
import {
  PRODUCTS_PER_PAGE,
  PRODUCT_STATUSES,
  STOCK_STATUSES,
  UNIT_NOUN,
} from "@/constants/commerce";
import { panelId, tabId } from "@/components/ui/tabs";
import { FilterTabs, type FilterTab } from "./filter-tabs";
import {
  COMMERCE_PRODUCTS,
  CATEGORIES,
  productCounts,
  stockStatusOf,
} from "@/lib/commerce-fixtures";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  Product,
  ProductStatus,
  ProductType,
  StockStatus,
} from "@/types/commerce";
import type { ProductCounts } from "@/lib/commerce-fixtures";
import { CommerceKpis, type CommerceKpi } from "./commerce-kpis";
import {
  formatPriceRange,
  hasLiveVariants,
  priceRangeOf,
  productImage,
  variantCount,
} from "@/lib/variants";
import {
  ProductStatusBadge,
  ProductThumb,
  ProductTypeLabel,
  StockBadge,
  VariantCountBadge,
} from "./commerce-badges";
import { FilterBar } from "./filter-bar";

type SortField = "name" | "price" | "sales" | "stock" | "updatedAt";

const ALL = "all";

/* -------------------------------------------------------------------------- */
/* KPIs                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The KPI row, counted by what a merchant sells rather than by stock level.
 *
 * Low Stock and Out of Stock used to lead this page. That is the right opening
 * for a warehouse and the wrong one for most MarketFlow merchants: a business
 * selling consultations and downloads has no stock, so two of its four headline
 * figures were permanently zero and told it this page was not for it. Those
 * figures now open Inventory, where they are the whole point.
 *
 * The mix is the useful reading here - "I have 12 things to sell and 7 of them
 * are services" - and it works whichever kinds a merchant actually has.
 */
function kpis(counts: ProductCounts): CommerceKpi[] {
  return [
    {
      label: "Total Products",
      /*
       * The same figure the All tab shows, from the same function.
       *
       * These two used to be computed separately and disagreed - the KPI
       * counted archived products and the tab did not. Passing one
       * `ProductCounts` through both is what makes the page's arithmetic
       * check out: Physical + Digital + Services == Total == All.
       */
      value: formatNumber(counts.all),
      icon: Package,
      tone: "brand",
      hint: `${counts.active} active · ${counts.draft} draft${
        counts.archived ? ` · ${counts.archived} archived` : ""
      }`,
    },
    /*
     * One identity colour per kind of product.
     *
     * The three types used to share a single brand tint with no tone at all on
     * two of them, so the strip read as one number repeated four times and a
     * merchant had to read every label to find the one they wanted. Each type
     * now keeps the hue it already has elsewhere in the product - cyan for the
     * things that ship, the email blue for downloads, the SMS violet for
     * booked time - so the colour is a second way to find the card rather than
     * decoration invented for this row.
     */
    {
      label: "Physical Products",
      value: formatNumber(counts.physical),
      /* A warehouse, not a second box: `Package` already carries Total
         Products, and two box glyphs side by side at 20px are the same shape
         twice. This one says what the card's own hint says - these are the
         things that are stocked and shipped - so the icon and the text
         agree. */
      icon: Warehouse,
      tone: "accent",
      hint: "Shipped to customers",
    },
    {
      label: "Digital Products",
      value: formatNumber(counts.digital),
      /* A file coming down, matching the hint: a download is the thing a
         buyer actually receives here. Distinct from the Digital tab's plain
         `Download` arrow directly below, so the two rows do not repeat one
         glyph at two sizes. */
      icon: FileDown,
      tone: "email",
      hint: "Downloads and access",
    },
    {
      label: "Services",
      value: formatNumber(counts.service),
      /* The same briefcase the Services tab uses, so the card and the filter
         it corresponds to are found by the same mark. */
      icon: Briefcase,
      tone: "sms",
      hint: "Booked and delivered",
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Workspace                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The views the row offers: three product types, then two lifecycle states.
 *
 * Both are ways of narrowing one list, which is why they share a row. They
 * do answer different questions - type is what a merchant sells, draft and
 * archived are where a thing is in its life - and the order says so: the
 * three types first, then the two states any of them can be in.
 */
type ProductView = typeof ALL | ProductType | "draft" | "archived";

const PRODUCT_VIEWS: {
  value: ProductView;
  label: string;
  icon: FilterTab["icon"];
}[] = [
  { value: ALL, label: "All", icon: Layers },
  { value: "physical", label: "Physical", icon: Package },
  { value: "digital", label: "Digital", icon: Download },
  { value: "service", label: "Services", icon: Briefcase },
  { value: "draft", label: "Draft", icon: FileEdit },
  { value: "archived", label: "Archived", icon: Archive },
];

export function ProductsWorkspace({
  initialTab,
}: {
  /** The raw `?tab=` the route read. Validated below, not by the caller. */
  initialTab?: string;
}) {
  const router = useRouter();
  /*
   * One list, filtered - not six pages.
   *
   * Type and lifecycle share a single control because they are the same
   * question asked twice ("show me a subset of my catalogue"), and because a
   * merchant who only sells services should be able to reach their whole
   * catalogue without meeting a Physical tab that is always empty.
   */
  const idBase = useId();

  /*
   * The tab is state, and the URL is kept in step with it.
   *
   * Seeded from the server-read `?tab=`, so a refresh or a pasted link opens
   * on the right view with the list already rendered. Every change writes the
   * parameter back with `replace` rather than `push` - switching a filter is
   * not a step a merchant wants to walk back through one tab at a time - and
   * `scroll: false` keeps the page where they were reading.
   */
  const [view, setViewState] = useState<ProductView>(() =>
    /* A hand-edited URL lands on All, not on a view that filters the list
       to nothing. */
    PRODUCT_VIEWS.some((item) => item.value === initialTab)
      ? (initialTab as ProductView)
      : ALL,
  );

  const setView = useCallback(
    (next: string) => {
      setViewState(next as ProductView);

      /* Built from the live query string so any other parameter survives. */
      const query = new URLSearchParams(window.location.search);
      /* The default never reaches the URL, so a clean list has a clean link. */
      if (next === ALL) query.delete("tab");
      else query.set("tab", next);

      const search = query.toString();
      router.replace(
        search ? `${window.location.pathname}?${search}` : window.location.pathname,
        { scroll: false },
      );
    },
    [router],
  );
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

  /*
   * Counts for the view strip and the KPI row, from one function.
   *
   * Over the whole catalogue rather than the filtered set - a tab reading
   * "Digital 0" because of an unrelated search is a tab that lies about what
   * the merchant sells.
   *
   * `productCounts` is deliberately the only place these are worked out. This
   * block used to mix two sources: All was counted here over the non-archived
   * catalogue while the type counts came from a helper that included archived
   * products, so the strip added up to one more than it displayed.
   */
  const counts = useMemo(() => productCounts(), []);

  const viewCounts = useMemo(
    () =>
      ({
        [ALL]: counts.all,
        physical: counts.physical,
        digital: counts.digital,
        service: counts.service,
        draft: counts.draft,
        archived: counts.archived,
      }) as Record<ProductView, number>,
    [counts],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = COMMERCE_PRODUCTS.filter((item) => {
      /* The view is either a product type or a lifecycle state - one control,
         because to a merchant they are the same act of narrowing. */
      if (view === "physical" || view === "digital" || view === "service") {
        if (item.type !== view) return false;
      }
      if (view === "draft" && item.status !== "draft") return false;
      if (view === "archived" && item.status !== "archived") return false;
      /* Archived products stay out of every other view: they are gone as far
         as the catalogue is concerned, and leaving them in makes the counts
         disagree with what a customer can buy. */
      if (view !== "archived" && item.status === "archived") return false;

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
      if (sortField === "sales") {
        return ((a.sales?.unitsSold ?? 0) - (b.sales?.unitsSold ?? 0)) * factor;
      }
      if (sortField === "stock") return (a.stock - b.stock) * factor;
      return (
        (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * factor
      );
    });
  }, [view, search, category, status, stock, sortField, direction]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice(
    (current - 1) * PRODUCTS_PER_PAGE,
    current * PRODUCTS_PER_PAGE,
  );

  /* Selection is scoped to the visible page - a select-all that silently
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
  const detailHref = (id: string) => `${APP_ROUTES.products}/${id}`;
  /* The variant badge goes straight to the grid rather than to an overview the
     merchant then has to navigate out of. */
  const variantsHref = (id: string) => `${detailHref(id)}?tab=variants`;

  /* Navigation is real; the writes stop at the mutations in `commerceApi`. */
  const rowActions = (item: Product) => [
    {
      label: "View product",
      icon: <Eye className="size-4" />,
      onSelect: () => router.push(detailHref(item.id)),
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
      <PageHeader
        title="Products"
        description="Manage physical products, digital products and services from one place."
        action={
          <div className="flex flex-wrap gap-2.5">
            <Button variant="outline" size="compact">
              <Upload aria-hidden />
              Import
            </Button>
            {/*
              * Straight to the form.
              *
              * This used to open a "What are you selling?" dialog first, on
              * the theory that the answer decides which fields the form
              * shows. It no longer does: Product Type is a field on the
              * form's own first tab and every tab after it adapts live, so
              * the dialog was an extra click to answer a question the form
              * asks again anyway.
              *
              * A link rather than a button, now there is nothing to open -
              * it is a navigation, so it middle-clicks and opens in a new
              * tab like one.
              */}
            <ButtonLink href={`${APP_ROUTES.products}/new`} size="compact">
              <Plus aria-hidden />
              Add Product
            </ButtonLink>
          </div>
        }
      />

      <CommerceKpis items={kpis(counts)} />

      <Card className="p-5">
        {/*
         * The view row.
         *
         * Real `role="tablist"` semantics now, which the old pill track could
         * not claim: these tabs own one panel - the list below - and arrow
         * keys move between them, so the role is earned rather than borrowed.
         *
         * It bleeds to the card's edges and pads back in, so its rule runs the
         * full width while its labels start on the same x as the table's first
         * column. The two read as one grid rather than a control sitting above
         * a table.
         */}
        <FilterTabs
          className="-mx-5 mb-5 px-5"
          idBase={idBase}
          activeTab={view}
          tabs={PRODUCT_VIEWS.map((item) => ({
            id: item.value,
            label: item.label,
            count: viewCounts[item.value] ?? 0,
            icon: item.icon,
          }))}
          onTabChange={(next) => {
            setView(next);
            setPage(1);
            setSelected([]);
          }}
        />

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
            label="Filter by category"
            size="sm"
            value={category}
            onChange={(next) => {
              setCategory(next);
              setPage(1);
            }}
            options={[
              { value: ALL, label: "All categories" },
              ...CATEGORIES.map((item) => ({ value: item.id, label: item.name })),
            ]}
            className="lg:w-44"
          />

          <Select
            label="Filter by status"
            size="sm"
            value={status}
            onChange={(next) => {
              setStatus(next as ProductStatus | typeof ALL);
              setPage(1);
            }}
            options={[
              { value: ALL, label: "All statuses" },
              ...PRODUCT_STATUSES,
            ]}
            className="lg:w-36"
          />

          {/* Stock is a physical-product question. Offering it while the list
              is showing services is offering a filter that can only empty it. */}
          {view === "physical" || view === ALL ? (
            <Select
              label="Filter by stock"
              size="sm"
              value={stock}
              onChange={(next) => {
                setStock(next as StockStatus | typeof ALL);
                setPage(1);
              }}
              options={[
                { value: ALL, label: "All stock levels" },
                ...STOCK_STATUSES,
              ]}
              className="lg:w-40"
            />
          ) : null}
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

        {/*
          * The panel the tabs control.
          *
          * `aria-controls` on a tab has to point at something, or it is a
          * dangling reference that tells a screen reader nothing. This is
          * that target: one panel for all six tabs, labelled by whichever is
          * currently selected.
          */}
        <div
          id={panelId(idBase, "list")}
          role="tabpanel"
          aria-labelledby={tabId(idBase, view)}
        >
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
                      onCheckedChange={toggleAll}
                      label="Select all products on this page"
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
                            onCheckedChange={() => toggleOne(item.id)}
                            label={`Select ${item.name}`}
                          />
                        </TD>

                        <TD>
                          <div className="flex items-center gap-3">
                            <ProductThumb
                              url={productImage(item)}
                              alt={item.name}
                            />
                            <div className="min-w-0">
                              <Link
                                href={detailHref(item.id)}
                                className="block truncate font-bold text-text-primary transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                              >
                                {item.name}
                              </Link>
                              {/*
                                * One row per product, always - a shirt with
                                * twelve sizes is still one thing a merchant
                                * sells, and spilling its variants into this
                                * list would bury the eleven other products.
                                * The count is the way in, not a preview.
                                */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <ProductTypeLabel type={item.type} />
                                {hasLiveVariants(item) ? (
                                  <Link
                                    href={variantsHref(item.id)}
                                    className="rounded-full focus-visible:shadow-focus focus-visible:outline-none"
                                  >
                                    <VariantCountBadge count={variantCount(item)} />
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </TD>

                        <TD className="text-text-secondary">{item.categoryName}</TD>
                        <TD className="font-mono text-sm text-text-muted">{item.sku}</TD>

                        {/* A product that sells at more than one price says so.
                            Showing only the cheapest variant is how a customer
                            gets quoted $29 for a $34 shirt. */}
                        <TD align="right">
                          {hasLiveVariants(item) ? (
                            <span className="font-bold whitespace-nowrap text-text-primary">
                              {formatPriceRange(priceRangeOf(item))}
                            </span>
                          ) : item.salePrice ? (
                            <span className="whitespace-nowrap">
                              <span className="font-bold text-text-primary">
                                {formatCurrency(item.salePrice)}
                              </span>{" "}
                              <s className="text-sm text-text-muted">
                                {formatCurrency(item.price)}
                              </s>
                            </span>
                          ) : (
                            <span className="font-bold text-text-primary">
                              {formatCurrency(item.price)}
                            </span>
                          )}
                        </TD>

                        {/*
                          * Sales, in the unit the product is actually sold in -
                          * "142 sales" for a shirt, "38 bookings" for a
                          * consultation. Stock rides underneath only where it
                          * is tracked, which is how a physical row keeps its
                          * reorder signal without a service row being told it
                          * is "Untracked".
                          */}
                        <TD align="right">
                          <span className="font-bold tabular-nums text-text-primary">
                            {formatNumber(item.sales?.unitsSold ?? 0)}
                          </span>
                          <span className="ml-1 text-sm font-medium text-text-muted">
                            {UNIT_NOUN[item.type][
                              (item.sales?.unitsSold ?? 0) === 1 ? "one" : "many"
                            ]}
                          </span>
                          {item.trackInventory ? (
                            <span
                              className={cn(
                                "mt-0.5 block text-meta font-medium tabular-nums",
                                stockState === "out-of-stock"
                                  ? "text-error"
                                  : stockState === "low-stock"
                                    ? "text-warning-text"
                                    : "text-text-muted",
                              )}
                            >
                              {item.stock} in stock
                            </span>
                          ) : null}
                        </TD>

                        <TD>
                          <div className="flex flex-col items-start gap-1">
                            <ProductStatusBadge status={item.status} />
                            {item.trackInventory ? (
                              <StockBadge status={stockState} />
                            ) : null}
                          </div>
                        </TD>

                        <TD className="text-sm whitespace-nowrap text-text-muted">
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
                        onCheckedChange={() => toggleOne(item.id)}
                        label={`Select ${item.name}`}
                        className="mt-1"
                      />
                      <ProductThumb url={productImage(item)} alt={item.name} />

                      <div className="min-w-0 flex-1">
                        <Link
                          href={detailHref(item.id)}
                          className="block truncate text-sm font-medium text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-0.5 font-mono text-sm text-text-muted">
                          {item.sku} · {item.categoryName}
                        </p>
                        {hasLiveVariants(item) ? (
                          <Link
                            href={variantsHref(item.id)}
                            className="mt-1 inline-flex rounded-full focus-visible:shadow-focus focus-visible:outline-none"
                          >
                            <VariantCountBadge count={variantCount(item)} />
                          </Link>
                        ) : null}
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
                        {hasLiveVariants(item)
                          ? formatPriceRange(priceRangeOf(item))
                          : formatCurrency(item.salePrice ?? item.price)}
                        <span className="ml-2 text-sm font-medium text-text-muted">
                          {formatNumber(item.sales?.unitsSold ?? 0)}{" "}
                          {UNIT_NOUN[item.type][
                            (item.sales?.unitsSold ?? 0) === 1 ? "one" : "many"
                          ]}
                        </span>
                        {item.trackInventory ? (
                          <span className="ml-2 text-sm font-medium text-text-muted">
                            · {item.stock} in stock
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
        </div>
      </Card>

    </>
  );
}
