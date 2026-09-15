"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  FolderTree,
  ImagePlus,
  Package,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Menu } from "@/components/ui/menu";
import { Pagination } from "@/components/ui/pagination";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { CATEGORIES_PER_PAGE, CATEGORY_STATUSES } from "@/constants/commerce";
import { CATEGORIES, categoryTotals } from "@/lib/commerce-fixtures";
import { formatDate, formatNumber } from "@/lib/format";
import { slugify } from "@/lib/utils";
import type { Category, CategoryStatus } from "@/types/commerce";
import { CategoryStatusBadge } from "./commerce-badges";

interface Draft {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: string;
  status: CategoryStatus;
}

const EMPTY: Draft = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  parentId: "",
  status: "active",
};

export function CategoriesWorkspace() {
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  function openCreate() {
    setEditing(null);
    setDraft(EMPTY);
    setError(null);
    setOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setDraft({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      imageUrl: category.imageUrl ?? "",
      parentId: category.parentId ?? "",
      status: category.status,
    });
    setError(null);
    setOpen(true);
  }

  function save() {
    if (!draft.name.trim()) {
      setError("Enter a category name.");
      return;
    }
    /* Wire to `useCreateCategoryMutation` / `useUpdateCategoryMutation`. */
    setOpen(false);
  }

  /* A category cannot be its own parent, so the one being edited is excluded. */
  const parentOptions = useMemo(
    () => CATEGORIES.filter((item) => item.id !== editing?.id),
    [editing],
  );

  /*
   * The page's totals and its rows come from one place.
   *
   * `categoryTotals` counts the whole set, not the visible slice — a footer
   * that said "8 categories" on page one and "7" on page two would be
   * describing the pagination rather than the catalogue.
   */
  const totals = categoryTotals();

  const totalPages = Math.max(
    1,
    Math.ceil(CATEGORIES.length / CATEGORIES_PER_PAGE),
  );
  const current = Math.min(page, totalPages);
  const rows = CATEGORIES.slice(
    (current - 1) * CATEGORIES_PER_PAGE,
    current * CATEGORIES_PER_PAGE,
  );

  /*
   * The closing total, in the footer's left slot beneath the range.
   *
   * It deliberately does *not* repeat the category count: the line directly
   * above it already reads "of 15 categories", and stacking "15 categories
   * covering 15 products" under that stutters. What the range line cannot say
   * is how much of the catalogue these categories actually account for, so
   * that is what this adds — together they read as one sentence.
   */
  const summary = (
    <>
      Covering{" "}
      <span className="font-medium text-text-secondary">
        {formatNumber(totals.products)}
      </span>{" "}
      {totals.products === 1 ? "product" : "products"}
      {totals.archived > 0 ? (
        <>
          {" · "}
          <span className="font-medium text-text-secondary">
            {formatNumber(totals.archived)}
          </span>{" "}
          archived
        </>
      ) : null}
    </>
  );

  return (
    <>
      {/*
        * The header lives here rather than in the route, because Add Category
        * opens a dialog this component owns — the same arrangement
        * `ProductsWorkspace` uses. Putting the button in the page and its state
        * one file away is what pushed it into the card in the first place.
        */}
      <PageHeader
        title="Categories"
        description="Organize physical products, digital products and services into categories."
        action={
          <Button size="compact" onClick={openCreate}>
            <Plus aria-hidden />
            Add Category
          </Button>
        }
      />

      {/* The card opens on the table itself — the count that used to sit above
          it is a closing total and now reads in the footer. */}
      <Card className="p-5">
        <div className="max-md:hidden">
          <Table minWidth="48rem">
            <THead>
              <TH>Category</TH>
              <TH>Description</TH>
              <TH align="right">Products</TH>
              <TH>Status</TH>
              <TH>Updated</TH>
              <TH align="right">Actions</TH>
            </THead>

            <TBody>
              {rows.map((item) => (
                <TR key={item.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-panel bg-primary-soft text-primary">
                        <FolderTree className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-text-primary">
                          {item.name}
                        </p>
                        <p className="font-mono text-sm text-text-muted">
                          /{item.slug}
                        </p>
                      </div>
                    </div>
                  </TD>

                  <TD className="max-w-xs">
                    <p className="truncate text-text-secondary">
                      {item.description ?? "—"}
                    </p>
                  </TD>

                  <TD align="right">
                    <span className="inline-flex items-center gap-1.5 font-bold text-text-primary tabular-nums">
                      <Package className="size-3.5 text-text-muted" aria-hidden />
                      {item.productCount}
                    </span>
                  </TD>

                  <TD>
                    <CategoryStatusBadge status={item.status} />
                  </TD>

                  <TD className="text-sm whitespace-nowrap text-text-muted">
                    {formatDate(item.updatedAt)}
                  </TD>

                  <TD align="right">
                    <Menu
                      label={`Actions for ${item.name}`}
                      items={[
                        {
                          label: "Edit category",
                          icon: <Pencil className="size-4" />,
                          onSelect: () => openEdit(item),
                        },
                        {
                          label: item.status === "active" ? "Archive" : "Restore",
                          icon: <Archive className="size-4" />,
                          onSelect: () => {},
                        },
                        {
                          label: "Delete",
                          icon: <Trash2 className="size-4" />,
                          onSelect: () => {},
                          destructive: true,
                          /* Deleting a category with products would orphan them. */
                          disabled: item.productCount > 0,
                        },
                      ]}
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>

        <ul className="space-y-2.5 md:hidden">
          {rows.map((item) => (
            <li key={item.id} className="rounded-panel border border-border p-3.5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-panel bg-primary-soft text-primary">
                  <FolderTree className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {item.name}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-text-secondary">
                    {item.description ?? "—"}
                  </p>
                </div>
                <Menu
                  label={`Actions for ${item.name}`}
                  items={[
                    {
                      label: "Edit category",
                      icon: <Pencil className="size-4" />,
                      onSelect: () => openEdit(item),
                    },
                    {
                      label: "Delete",
                      icon: <Trash2 className="size-4" />,
                      onSelect: () => {},
                      destructive: true,
                      disabled: item.productCount > 0,
                    },
                  ]}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <CategoryStatusBadge status={item.status} />
                <span className="text-sm text-text-muted">
                  {item.productCount} products
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <Pagination
            page={current}
            totalPages={totalPages}
            total={CATEGORIES.length}
            perPage={CATEGORIES_PER_PAGE}
            onChange={setPage}
            noun="categories"
            summary={summary}
          />
        </div>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit category" : "Add category"}
        description="Categories group products for filters, catalogs and reporting."
        footer={
          <>
            <Button variant="outline" size="compact" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="compact" onClick={save}>
              {editing ? "Save category" : "Create category"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Name" htmlFor="cat-name" error={error ?? undefined}>
            <Input
              id="cat-name"
              value={draft.name}
              error={Boolean(error)}
              onChange={(event) => {
                set("name", event.target.value);
                if (!editing) set("slug", slugify(event.target.value));
              }}
            />
          </Field>

          <Field label="Slug" htmlFor="cat-slug">
            <Input
              id="cat-slug"
              value={draft.slug}
              className="font-mono"
              onChange={(event) => set("slug", slugify(event.target.value))}
            />
          </Field>

          <Field label="Description" htmlFor="cat-description">
            <Textarea
              id="cat-description"
              value={draft.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </Field>

          {/* Shown on the storefront category tile, so it is optional here. */}
          <Field
            label="Image"
            htmlFor="cat-image"
            hint="Optional. Used on the customer-facing catalog."
          >
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-panel border border-dashed border-border-strong bg-surface-secondary text-text-muted">
                {draft.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={draft.imageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <ImagePlus className="size-4" aria-hidden />
                )}
              </span>
              <Input
                id="cat-image"
                value={draft.imageUrl}
                onChange={(event) => set("imageUrl", event.target.value)}
              />
            </div>
          </Field>

          <Field label="Parent Category" htmlFor="cat-parent">
            <Select
              id="cat-parent"
              label="Parent Category"
              hideLabel={false}
              value={draft.parentId}
              onChange={(next) => set("parentId", next)}
              options={[
                { value: "", label: "None — top level" },
                ...parentOptions.map((item) => ({ value: item.id, label: item.name })),
              ]}
            />
          </Field>

          <Field label="Status" htmlFor="cat-status">
            <Select
              id="cat-status"
              label="Status"
              hideLabel={false}
              value={draft.status}
              onChange={(next) => set("status", next as CategoryStatus)}
              options={CATEGORY_STATUSES}
            />
          </Field>
        </div>
      </Dialog>
    </>
  );
}
