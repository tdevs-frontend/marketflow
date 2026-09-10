import { Check } from "lucide-react";

/**
 * One ticked capability under the CTA.
 *
 * The circle is WhatsApp's own green, filled solid rather than tinted: on a
 * purple ground a transparent green disc reads as a hole, and these ticks are
 * the section's one "this is the WhatsApp product" signal below the badge.
 *
 * The glyph inside is decorative — the label beside it is the accessible text,
 * and it is white on green because that is what a success tick looks like
 * everywhere, at a stroke weight heavy enough to hold its shape at 12px.
 */
export function SuccessFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="grid size-5 shrink-0 place-items-center rounded-full bg-whatsapp-brand text-white shadow-[0_2px_8px_rgba(37,211,102,0.35)]"
      >
        <Check className="size-3" strokeWidth={3.2} />
      </span>
      <span className="text-sm font-medium text-white">{children}</span>
    </li>
  );
}
