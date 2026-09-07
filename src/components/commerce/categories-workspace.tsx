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

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Menu } from "@/components/ui/menu";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { CATEGORY_STATUSES } from "@/constants/commerce";
import { CATEGORIES } from "@/lib/commerce-fixtures";
import { formatDate } from "@/lib/format";
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

  const totalProducts = CATEGORIES.reduce((sum, item) => sum + item.productCount, 0);

  return (
    <>
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{CATEGORIES.length}</span>{" "}
            categories covering{" "}
            <span className="font-medium text-text-primary">{totalProducts}</span>{" "}
            products.
          </p>
          <Button size="compact" onClick={openCreate}>
            <Plus aria-hidden />
            Add Category
          </Button>
        </div>

        <div className="mt-4 max-md:hidden">
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
              {CATEGORIES.map((item) => (
                <TR key={item.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-panel bg-primary-soft text-primary">
                        <FolderTree className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-text-primary">
                          {item.name}
                        </p>
                        <p className="font-mono text-[11px] text-text-muted">
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
                    <span className="inline-flex items-center gap-1.5 font-medium text-text-primary tabular-nums">
                      <Package className="size-3.5 text-text-muted" aria-hidden />
                      {item.productCount}
                    </span>
                  </TD>

                  <TD>
                    <CategoryStatusBadge status={item.status} />
                  </TD>

                  <TD className="text-xs whitespace-nowrap text-text-muted">
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

        <ul className="mt-4 space-y-2.5 md:hidden">
          {CATEGORIES.map((item) => (
            <li key={item.id} className="rounded-panel border border-border p-3.5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-panel bg-primary-soft text-primary">
                  <FolderTree className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {item.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-text-secondary">
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
                <span className="text-xs text-text-muted">
                  {item.productCount} products
                </span>
              </div>
            </li>
          ))}
        </ul>
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
              placeholder="Service Packages"
              className="h-11"
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
              placeholder="service-packages"
              className="h-11 font-mono"
              onChange={(event) => set("slug", slugify(event.target.value))}
            />
          </Field>

          <Field label="Description" htmlFor="cat-description">
            <Textarea
              id="cat-description"
              value={draft.description}
              placeholder="What belongs in this category."
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
                placeholder="https://…/category.jpg"
                className="h-11"
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
