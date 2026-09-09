import { cn } from "@/lib/utils";
import { TONES, type PlatformFeature } from "./platform-features";

/**
 * A module's icon, in the one size and weight the section uses everywhere.
 *
 * Two variants over one geometry — 44px tile, 12px radius, 20px glyph at 1.9
 * stroke — so a module's card tile and its orbit satellite are recognisably the
 * same object at a glance:
 *
 *   tile  on a card. Soft ground in the module's tone, picking up a halo in
 *         that tone when the card is hovered.
 *   node  on the orbit. White ground with a hairline and the tone carried by
 *         the glyph alone, since eight tinted grounds ringing the hub would
 *         out-shout the hub.
 *
 * `aria-hidden` in both cases: the card names the module beside it, and the
 * satellites are the rails restated.
 *
 * No WhatsApp glyph here. `ui/brand-icon` carries the marks Lucide dropped and
 * WhatsApp is not among them, so the module keeps Lucide's `MessageCircle` and
 * takes its identity from the channel green rather than from a redrawn logo.
 */
export function FeatureIcon({
  feature,
  variant = "tile",
  title,
  className,
  style,
}: {
  feature: PlatformFeature;
  variant?: "tile" | "node";
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const tone = TONES[feature.tone];

  return (
    <span
      aria-hidden
      title={title}
      style={style}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-[12px]",
        variant === "tile"
          ? cn("transition-shadow duration-200", tone.chip, tone.glow)
          : cn("border border-border bg-surface shadow-card", tone.ink),
        className,
      )}
    >
      <feature.icon className="size-5" strokeWidth={1.9} />
    </span>
  );
}
