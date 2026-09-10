import { BrandIcon } from "@/components/ui/brand-icon";
import { cn } from "@/lib/utils";
import { WORKSPACE_NAV } from "./automation-data";

/**
 * The application's icon rail.
 *
 * Purely a shape — the labels live in the mock-up's `aria-label`, so the rail
 * is hidden from assistive tech and carries no text at any size. WhatsApp is
 * the active destination and takes the product's indigo active state; it is
 * also the one item drawn with its own channel mark, because a rail of six
 * identical outline glyphs says nothing about which product this is.
 */
export function WorkspaceSidebar() {
  return (
    <div
      aria-hidden
      className="flex w-8 shrink-0 flex-col items-center gap-1 border-r border-border bg-surface py-1.5 @[440px]:w-11 @[440px]:gap-1.5 @[440px]:py-2.5 @[600px]:w-12 @[600px]:gap-2 @[600px]:py-3"
    >
      {WORKSPACE_NAV.map((item) => (
        <span
          key={item.label}
          className={cn(
            "grid size-5 place-items-center rounded-md @[440px]:size-7 @[440px]:rounded-lg @[600px]:size-8",
            item.active
              ? "bg-primary-soft text-primary"
              : "text-text-muted/70",
          )}
        >
          {item.brand ? (
            <BrandIcon
              name={item.brand}
              className="size-2.5 @[440px]:size-3.5 @[600px]:size-4"
            />
          ) : (
            <item.icon
              className="size-2.5 @[440px]:size-3.5 @[600px]:size-4"
              strokeWidth={1.8}
            />
          )}
        </span>
      ))}
    </div>
  );
}
