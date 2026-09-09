import { UserCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { ART_HOVER, CARD_HOVER, CARD_SHELL } from "./automation-data";

/**
 * The outcome the column exists to reach.
 *
 * Same shell as the steps above it, so the four cards read as one stack — the
 * only thing that separates it is the green tile and a slightly heavier
 * figure. That is enough: with no connectors to carry the sequence, the
 * difference between "the automation working" and "the automation finished"
 * has to be legible from colour alone.
 */
export function QualifiedLeadCard({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex w-full items-center gap-3 px-3.5 py-3",
        CARD_SHELL,
        ART_HOVER,
        CARD_HOVER,
        className,
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-whatsapp-soft text-whatsapp">
        <UserCheck className="size-5" strokeWidth={1.8} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] leading-tight font-bold text-text-primary">
          Lead qualified
        </span>
        <span className="mt-1.5 block truncate text-[12px] leading-none text-text-muted">
          Ready for sales
        </span>
      </span>
    </span>
  );
}
