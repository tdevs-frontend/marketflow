"use client";

import {
  CalendarDays,
  Filter,
  Frame,
  LayoutTemplate,
  Webhook,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { START_TYPES } from "@/constants/automation";
import { cn } from "@/lib/utils";
import type { StartTypeKey } from "@/types/workflow";

const ICONS: Record<string, LucideIcon> = {
  Zap,
  Filter,
  CalendarDays,
  Webhook,
  LayoutTemplate,
  Frame,
};

/**
 * How a contact gets into this workflow — the first question, asked plainly.
 *
 * This screen exists because dropping somebody onto an empty canvas answers
 * none of the questions they actually have. "Welcome Series" is a template, a
 * recipe; "Event-based" is the mechanism. Most automation tools blur the two,
 * and the result is a builder whose author cannot say why anybody is in the
 * workflow at all.
 *
 * Cards, not a dropdown: six options each need a line of explanation and three
 * examples to be choosable without documentation, and a `<select>` has room
 * for none of that. They are the product's own `Card` at the product's own
 * size — this is a dashboard step, not a pricing page.
 */
export function StartTypeCards({
  value,
  onSelect,
}: {
  value?: StartTypeKey;
  onSelect: (key: StartTypeKey) => void;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {START_TYPES.map((type) => {
        const Icon = ICONS[type.icon] ?? Zap;
        const selected = value === type.key;

        return (
          <li key={type.key}>
            <Card
              className={cn(
                "h-full",
                selected && "border-primary shadow-[0_0_0_3px_rgba(99,102,241,0.12)]",
              )}
              interactive={!selected}
            >
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(type.key)}
                className="flex h-full w-full flex-col p-4 text-left focus-visible:shadow-focus focus-visible:outline-none"
              >
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-btn",
                    selected
                      ? "bg-primary text-white"
                      : "bg-primary-soft text-primary",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>

                <span className="mt-3 block text-sm font-semibold text-text-primary">
                  {type.label}
                </span>
                <span className="mt-1 block text-xs text-text-secondary">
                  {type.description}
                </span>

                <span className="mt-3 flex flex-wrap gap-1.5 pt-0.5">
                  {type.examples.map((example) => (
                    <span
                      key={example}
                      className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-text-muted"
                    >
                      {example}
                    </span>
                  ))}
                </span>
              </button>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
