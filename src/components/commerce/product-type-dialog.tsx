"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { PRODUCT_TYPE_CHOICES } from "@/constants/commerce";
import { APP_ROUTES } from "@/constants/app";
import { cn } from "@/lib/utils";
import type { ProductType } from "@/types/commerce";

/**
 * "What are you selling?" — the step before the product form.
 *
 * MarketFlow does not assume a merchant sells physical goods, and the cheapest
 * moment to find out which kind of thing this is happens to be the first: the
 * answer decides which fields the form shows, whether stock exists, and how the
 * order that eventually contains it gets fulfilled. Asking afterwards means a
 * form full of weights and shipping toggles for someone selling an ebook.
 *
 * Three cards rather than a dropdown. The choice is consequential and each
 * option needs a line explaining what it implies, which a `<select>` cannot
 * carry — and at three options a picker is not a scrolling problem.
 *
 * The type is passed to the form as a query parameter rather than held in a
 * store, so the form is reachable and shareable on its own: `/products/new`
 * with `?type=service` is a link a merchant can bookmark.
 */
export function ProductTypeDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [type, setType] = useState<ProductType>("physical");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="What are you selling?"
      description="This decides which details the product form asks for."
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="compact"
            onClick={() => {
              onClose();
              router.push(`${APP_ROUTES.products}/new?type=${type}`);
            }}
          >
            Continue
            <ArrowRight aria-hidden />
          </Button>
        </>
      }
    >
      {/* One column on a phone, three from `sm` — a card with a description
          does not survive being a third of a 360px screen. */}
      <div className="grid gap-2.5 sm:grid-cols-3">
        {PRODUCT_TYPE_CHOICES.map((choice) => {
          const selected = choice.value === type;

          return (
            <label
              key={choice.value}
              className={cn(
                "relative flex cursor-pointer flex-col gap-2 rounded-panel border p-3.5 transition-all focus-within:shadow-focus",
                selected
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-surface hover:border-border-strong hover:bg-surface-secondary",
              )}
            >
              <input
                type="radio"
                name="product-type"
                value={choice.value}
                checked={selected}
                onChange={() => setType(choice.value)}
                className="sr-only"
              />

              <span className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-btn",
                    selected
                      ? "bg-primary text-white"
                      : "bg-surface-secondary text-text-secondary",
                  )}
                >
                  <Icon name={choice.icon} className="size-4.5" />
                </span>
                {selected ? (
                  <span
                    aria-hidden
                    className="grid size-4.5 shrink-0 place-items-center rounded-full bg-primary text-white"
                  >
                    <Check className="size-3" />
                  </span>
                ) : null}
              </span>

              <span
                className={cn(
                  "text-sm font-semibold",
                  selected ? "text-primary-dark" : "text-text-primary",
                )}
              >
                {choice.label}
              </span>
              <span className="text-sm text-text-secondary">
                {choice.description}
              </span>
            </label>
          );
        })}
      </div>

      <p className="mt-4 text-meta text-text-muted">
        You can change the type later, but the fields it collects differ — a
        service has no stock, and a download has no weight.
      </p>
    </Dialog>
  );
}
