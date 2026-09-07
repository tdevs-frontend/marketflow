"use client";

import { useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Eye,
  Link2,
  Mail,
  MessageCircle,
  Plus,
  QrCode,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CATALOG_STATUSES } from "@/constants/commerce";
import { CATALOGS, PRODUCTS, productById, stockStatusOf } from "@/lib/commerce-fixtures";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Catalog, CatalogStatus } from "@/types/commerce";
import { CatalogStatusBadge, ProductThumb } from "./commerce-badges";

/* -------------------------------------------------------------------------- */
/* Share                                                                      */
/* -------------------------------------------------------------------------- */

function ShareRow({
  icon,
  label,
  hint,
  onClick,
  primary = false,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-panel border px-3.5 py-3 text-left transition-colors focus-visible:shadow-focus focus-visible:outline-none",
        primary
          ? "border-primary-border bg-primary-soft hover:bg-primary-soft-hover"
          : "border-border hover:bg-surface-secondary",
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-btn",
          primary ? "bg-primary text-white" : "bg-surface-secondary text-text-muted",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-sm font-medium",
            primary ? "text-primary-dark" : "text-text-primary",
          )}
        >
          {label}
        </span>
        <span className="block text-xs text-text-muted">{hint}</span>
      </span>
    </button>
  );
}

function ShareDialog({
  catalog,
  onClose,
}: {
  catalog: Catalog | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!catalog) return;
    try {
      await navigator.clipboard.writeText(catalog.shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard can be blocked by permissions; the link is visible anyway. */
    }
  }

  return (
    <Dialog
      open={Boolean(catalog)}
      onClose={onClose}
      title="Share catalog"
      description={catalog ? catalog.name : undefined}
    >
      {catalog ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-panel border border-border bg-surface-secondary px-3 py-2.5">
            <Link2 className="size-4 shrink-0 text-text-muted" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary">
              {catalog.shareUrl}
            </span>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {/* WhatsApp leads: it is how this catalog actually reaches people. */}
          <ShareRow
            primary
            icon={<MessageCircle className="size-4" />}
            label="Share on WhatsApp"
            hint="Send to a contact, a segment, or your broadcast list"
          />

          <div className="space-y-2.5">
            <ShareRow
              icon={<Mail className="size-4" />}
              label="Share via Email"
              hint="Attach the catalog to an email campaign"
            />
            <ShareRow
              icon={<QrCode className="size-4" />}
              label="QR Code"
              hint="Print for counters, packaging and events"
            />
            <ShareRow
              icon={<Code2 className="size-4" />}
              label="Embed"
              hint="Drop the catalog into your own site"
            />
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Preview                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * What the customer sees. Rendered inside a device-ish frame so it never reads
 * as part of the merchant UI around it.
 */
function CatalogPreview({
  catalog,
  onClose,
}: {
  catalog: Catalog | null;
  onClose: () => void;
}) {
  const products = (catalog?.productIds ?? [])
    .map(productById)
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <Dialog
      open={Boolean(catalog)}
      onClose={onClose}
      title="Catalog preview"
      description="How customers see this catalog when you share it."
      size="lg"
    >
      <div className="rounded-card border border-border bg-background p-4 sm:p-6">
        <header className="text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-primary text-sm font-bold text-white">
            MF
          </span>
          <h3 className="mt-3 text-lg">MarketFlow Store</h3>
          <p className="mt-1 text-sm text-text-secondary">
            {catalog?.description ?? "Our current line-up"}
          </p>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {products.map((product) => {
            const state = stockStatusOf(product.stock, product.lowStockThreshold);
            const available = state !== "out-of-stock";

            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-panel border border-border bg-surface"
              >
                <div className="grid aspect-video place-items-center bg-primary-subtle">
                  <ProductThumb size="lg" className="border-0 bg-transparent" />
                </div>

                <div className="p-3.5">
                  <h4 className="truncate text-sm font-medium text-text-primary">
                    {product.name}
                  </h4>

                  <p className="mt-1.5">
                    {product.salePrice ? (
                      <>
                        <span className="text-base font-bold text-text-primary">
                          {formatCurrency(product.salePrice)}
                        </span>{" "}
                        <s className="text-xs text-text-muted">
                          {formatCurrency(product.price)}
                        </s>
                      </>
                    ) : (
                      <span className="text-base font-bold text-text-primary">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </p>

                  <p
                    className={cn(
                      "mt-1 text-xs",
                      available ? "text-primary" : "text-text-muted",
                    )}
                  >
                    {available ? "In stock" : "Currently unavailable"}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Product
                    </Button>
                    <Button size="sm" className="flex-1" disabled={!available}>
                      Buy Now
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Create                                                                     */
/* -------------------------------------------------------------------------- */

function CreateCatalogDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CatalogStatus>("draft");
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  /* Only sellable products belong in something a customer will open. */
  const selectable = PRODUCTS.filter((item) => item.status === "active");

  function toggle(id: string) {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  function submit() {
    if (!name.trim()) {
      setError("Name the catalog.");
      return;
    }
    if (picked.length === 0) {
      setError("Add at least one product.");
      return;
    }
    /* Wire to `useCreateCatalogMutation`. */
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create catalog"
      description="Pick the products, then share the catalog wherever your customers are."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button size="compact" onClick={submit}>
            Create catalog
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Catalog Name" htmlFor="cat-name" error={error ?? undefined}>
            <Input
              id="cat-name"
              value={name}
              error={Boolean(error)}
              placeholder="Summer Collection"
              className="h-11"
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          <Field label="Status" htmlFor="cat-status">
            <Select
              id="cat-status"
              label="Status"
              hideLabel={false}
              value={status}
              onChange={(next) => setStatus(next as CatalogStatus)}
              options={CATALOG_STATUSES}
            />
          </Field>
        </div>

        <Field label="Description" htmlFor="cat-desc">
          <Textarea
            id="cat-desc"
            value={description}
            placeholder="What this collection is for."
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <fieldset>
          <legend className="text-sm font-medium text-text-primary">
            Products
            <span className="ml-2 font-normal text-text-muted">
              {picked.length} selected
            </span>
          </legend>

          <ul className="mt-2.5 max-h-64 divide-y divide-border overflow-y-auto rounded-panel border border-border">
            {selectable.map((product) => (
              <li key={product.id}>
                <label className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-surface-secondary">
                  <Checkbox
                    checked={picked.includes(product.id)}
                    onCheckedChange={() => toggle(product.id)}
                    label={`Add ${product.name} to catalog`}
                  />
                  <ProductThumb size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text-primary">
                      {product.name}
                    </span>
                    <span className="block text-xs text-text-muted">
                      {product.categoryName}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-text-primary tabular-nums">
                    {formatCurrency(product.salePrice ?? product.price)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </div>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Workspace                                                                  */
/* -------------------------------------------------------------------------- */

export function CatalogWorkspace() {
  const [sharing, setSharing] = useState<Catalog | null>(null);
  const [previewing, setPreviewing] = useState<Catalog | null>(null);
  const [creating, setCreating] = useState(false);

  /* The header's Preview opens whatever customers would actually land on. */
  const published = CATALOGS.find((item) => item.status === "published") ?? null;

  return (
    <>
      {/*
       * The header lives here rather than in the route because both of its
       * actions open dialogs, and the dialog state belongs with the grid.
       */}
      <PageHeader
        title="Product Catalog"
        description="Create and manage the product catalog you share with customers."
        action={
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="outline"
              size="compact"
              disabled={!published}
              onClick={() => setPreviewing(published)}
            >
              <Eye aria-hidden />
              Preview Catalog
            </Button>
            <Button size="compact" onClick={() => setCreating(true)}>
              <Plus aria-hidden />
              Create Catalog
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CATALOGS.map((catalog) => (
          <Card key={catalog.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base">{catalog.name}</h2>
              <CatalogStatusBadge status={catalog.status} />
            </div>

            <p className="mt-1.5 line-clamp-2 text-sm text-text-secondary">
              {catalog.description}
            </p>

            {/* A row of thumbs says more about a catalog than a count does. */}
            <div className="mt-4 flex items-center gap-1.5">
              {catalog.productIds.slice(0, 4).map((id) => (
                <ProductThumb key={id} size="sm" />
              ))}
              {catalog.productIds.length > 4 ? (
                <span className="grid size-8 place-items-center rounded-panel border border-border bg-surface-secondary text-[11px] font-medium text-text-muted">
                  +{catalog.productIds.length - 4}
                </span>
              ) : null}
            </div>

            <dl className="mt-4 flex items-center gap-5 text-xs text-text-muted">
              <div>
                <dt className="sr-only">Products</dt>
                <dd>
                  <span className="font-medium text-text-secondary">
                    {catalog.productIds.length}
                  </span>{" "}
                  products
                </dd>
              </div>
              <div>
                <dt className="sr-only">Views</dt>
                <dd>
                  <span className="font-medium text-text-secondary">
                    {formatNumber(catalog.views)}
                  </span>{" "}
                  views
                </dd>
              </div>
            </dl>

            <p className="mt-1 text-xs text-text-muted">
              Updated {formatDate(catalog.updatedAt)}
            </p>

            <div className="mt-4 flex gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setPreviewing(catalog)}
              >
                <Eye aria-hidden />
                Preview
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setSharing(catalog)}
              >
                <MessageCircle aria-hidden />
                Share
              </Button>
            </div>
          </Card>
        ))}

        {/* Create tile, in the grid so the action sits with the collection. */}
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border-strong bg-surface-secondary/60 p-5 text-center transition-colors hover:border-primary hover:bg-primary-subtle focus-visible:shadow-focus focus-visible:outline-none"
        >
          <span className="grid size-10 place-items-center rounded-full bg-surface text-primary">
            <Plus className="size-5" aria-hidden />
          </span>
          <span className="text-sm font-medium text-text-primary">Create catalog</span>
          <span className="max-w-48 text-xs text-text-muted">
            Group products for a campaign, a season or a customer segment.
          </span>
        </button>
      </div>

      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base">
            {formatNumber(PRODUCTS.filter((item) => item.featured).length)} featured
            products lead your catalogs
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Featured products appear first wherever a catalog is shared.
          </p>
        </div>
      </Card>

      <ShareDialog catalog={sharing} onClose={() => setSharing(null)} />
      <CatalogPreview catalog={previewing} onClose={() => setPreviewing(null)} />
      <CreateCatalogDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
