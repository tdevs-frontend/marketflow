"use client";

import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IntegrationProvider } from "@/types/integration";

/**
 * Pick the adapter.
 *
 * A radio group rather than a `Select`: choosing between SMTP, SES, Mailgun,
 * SendGrid and Postmark is a decision, and a decision made from a collapsed
 * dropdown is made without reading the one line under each name that explains
 * the difference.
 *
 * Real radio inputs, visually hidden. Arrow-key movement, the roving tab stop
 * and the group semantics all come free from the platform, and a card-shaped
 * `div` with `onClick` gets none of them.
 */
export function ProviderSelector({
  providers,
  value,
  onChange,
  name,
  className,
}: {
  providers: IntegrationProvider[];
  value: string | null;
  onChange: (id: string) => void;
  /** Groups the radios. Must be unique if two selectors are ever mounted. */
  name: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2.5 sm:grid-cols-2", className)}>
      {providers.map((provider) => {
        const selected = provider.id === value;

        return (
          <label
            key={provider.id}
            className={cn(
              "relative flex cursor-pointer items-start gap-3 rounded-panel border p-3.5 transition-all",
              "focus-within:shadow-focus",
              selected
                ? "border-primary bg-primary-soft"
                : "border-border bg-surface hover:border-border-strong hover:bg-surface-secondary",
            )}
          >
            <input
              type="radio"
              name={name}
              value={provider.id}
              checked={selected}
              onChange={() => onChange(provider.id)}
              className="sr-only"
            />

            <span
              aria-hidden
              className={cn(
                "mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full border transition-colors",
                selected
                  ? "border-primary bg-primary text-white"
                  : "border-border-strong bg-surface",
              )}
            >
              {selected ? <Check className="size-3" /> : null}
            </span>

            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    selected ? "text-primary-dark" : "text-text-primary",
                  )}
                >
                  {provider.name}
                </span>
                {provider.recommended ? (
                  <Badge tone="brand" size="sm" className="normal-case">
                    Recommended
                  </Badge>
                ) : null}
              </span>
              <span className="mt-0.5 block text-sm text-text-secondary">
                {provider.description}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
