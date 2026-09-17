import { TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The lifecycle, widest first.
 *
 * Customers sit under Orders because repeat buyers place more than one.
 *
 * A hue per stage, which is a deliberate reversal. This card used to draw one
 * indigo deepening downward, on the reasoning that five colours imply five
 * unrelated measures rather than one population thinning — the rule
 * `FUNNEL_RAMP` still follows on the analytics funnels. It holds where the
 * stages are only a shape; it stops holding here, because each band has to be
 * matched by eye to its row in the key beside it, and a hue does that where
 * five shades of one indigo do not.
 *
 * One flat token per stage — blue, teal, orange, purple, indigo. Gradients
 * were tried and taken out again: across a band only 200 units wide the second
 * stop reads as a smudge rather than as light, and five of them put ten
 * colours on a card whose job is to show one shape.
 *
 * The labels are the business phrasing — "Website visitors", not "Visitors" —
 * because the column has the room and a funnel stage named in one word leaves
 * the reader to guess what was counted.
 */
const STAGES = [
  { label: "Website visitors", count: 48_920, fill: "--color-info" },
  { label: "Captured leads", count: 12_480, fill: "--color-whatsapp" },
  { label: "Qualified prospects", count: 7_820, fill: "--color-warning" },
  { label: "Completed orders", count: 2_845, fill: "--color-sms" },
  { label: "Converted customers", count: 2_430, fill: "--color-primary" },
] as const;

const TOP = STAGES[0].count;
const LAST = STAGES[STAGES.length - 1];

/** Movement in the visitor-to-customer rate against the previous period. */
const CONVERSION_CHANGE = 12;

/* -------------------------------------------------------------------------- */
/* Geometry                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The funnel is drawn, not charted.
 *
 * No chart library is involved on purpose. This project runs every chart
 * through one ApexCharts boundary that is `ssr: false` and therefore a client
 * component; a funnel is five trapezoids, which is less code as SVG than as a
 * chart config, keeps this card on the server, and avoids a second charting
 * dependency for one widget.
 *
 * One band per list row rather than one SVG for the whole funnel. The bands
 * and the figures beside them have to line up, and the only way to guarantee
 * that at every width is to put each pair in the same grid row — an SVG sized
 * independently of the list would drift out of step the moment a label wrapped.
 * Each band stretches to its row with `preserveAspectRatio="none"`, which is
 * safe here because a trapezoid's edges stay straight under any scale.
 */
const BAND_WIDTH = 200;

/**
 * 56 units tall, and 56 *pixels* tall in the row that renders it.
 *
 * Five of them make the 280px chart the card asks for, and matching the
 * viewBox height to the row height is what keeps `preserveAspectRatio="none"`
 * scaling horizontally only — the leader rule stays a true 1px instead of
 * thickening with the band.
 *
 * It is also what gives the figures beside the bands their air: the value and
 * its label sit in a 56px row rather than a 40px one, so the five pairs read
 * as five entries instead of one block of text.
 */
const BAND_HEIGHT = 56;

/**
 * The silhouette narrows by an equal step per stage, from the full mouth down
 * to `NECK`.
 *
 * Deliberately *not* proportional to the counts, and the reference this card
 * is built from is not either — its stages read 672, 320, 200 and 152, a drop
 * of more than half at the first step, while its second band is drawn at about
 * three quarters of the mouth. A funnel motif is drawn as an even cone.
 *
 * Proportional widths were tried and are wrong here for a reason worth
 * recording: visitors outnumber leads four to one, so the first band collapsed
 * to a cliff and the remaining four stood as near-parallel walls — a shape
 * that reads as a funnel with a long straight stem rather than a taper. The
 * counts are stated beside every band, at full weight, so the silhouette is
 * free to be a motif and the figures carry the reading.
 */
const NECK = 0.3;
const STEP = (1 - NECK) / STAGES.length;

const edgeAt = (index: number) => (1 - STEP * index) * BAND_WIDTH;

/**
 * Each band runs from its own edge down to the next one, so consecutive bands
 * share a boundary and the funnel is one continuous shape rather than five
 * stacked bars.
 */
const BANDS = STAGES.map((stage, index) => {
  const top = edgeAt(index);
  const bottom = edgeAt(index + 1);
  const centre = BAND_WIDTH / 2;
  /* Where the band's right edge sits at half height — the point the leader
     line has to start from if it is to touch the shape rather than float. */
  const midEdge = centre + (top + bottom) / 4;

  return {
    label: stage.label,
    count: stage.count,
    fill: stage.fill,
    midEdge,
    d: [
      `M ${centre - top / 2} 0`,
      `L ${centre + top / 2} 0`,
      `L ${centre + bottom / 2} ${BAND_HEIGHT}`,
      `L ${centre - bottom / 2} ${BAND_HEIGHT}`,
      "Z",
    ].join(" "),
  };
});

/**
 * Compact throughout, including under 10,000.
 *
 * `formatNumber` switches to compact only above 10,000, which would print
 * "48.9K" next to "7,820" and give the key two number formats in five rows.
 * This card is read for the shape and the rate at the bottom; the exact counts
 * live in the data.
 */
const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The lifecycle as one shape, with the figures beside it rather than inside it.
 *
 * The step-by-step drop-off lines are gone. They stated the same reading three
 * ways — a percentage that continued, a count that did not, and the taper of
 * the band underneath — and four of them stacked between five stages turned a
 * shape you take in at a glance into a paragraph.
 *
 * Nothing is written on the bands. Two of the five fills are light enough that
 * white would fail contrast on them, and a funnel that needs its labels inside
 * has no room for them by the bottom stage anyway. The key names the stages,
 * the band carries the shape, and sharing a grid row ties one to the other.
 */
export function SalesFunnel({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="min-w-0">
        <h2 className="text-base sm:text-lg">Sales Funnel</h2>
        <p className="mt-1 text-sm text-text-secondary font-medium">
          How prospects move from first interaction to purchase.
        </p>
      </div>

      {/*
        One row per stage, and the pair is centred rather than stretched.

        The tracks were `9fr 11fr`, and an `fr` always fills its container — so
        the funnel was pinned to the card's left edge and the labels carried
        about 80px of dead space on their right, which is what made the group
        read as top-left rather than centred. Fixed tracks plus `justify-center`
        on the grid put the same pair in the middle of the card with balanced
        margins, and because every row is the same total width the labels still
        line up as one column.

        The funnel track is `minmax`, not a fixed width, because the card is
        not one width. At a 1280px viewport this card's content box is about
        346px, and with the label column at a fixed 9rem that leaves 186px for
        the funnel — a 14rem band would overflow. At 1440px the box is 413px
        and 14rem fits with room either side. The range lets the shape take the
        full 224px wherever the card affords it and fall back to filling what
        is there when it does not, with no overflow at either end.

        The label track stays fixed rather than fluid so the funnel absorbs all
        the variation: 9rem is what "Converted customers" needs at `text-sm`,
        and a track that shrank with the card would truncate the longest stage
        name on exactly the screens where space is tightest.

        The `fr` pair stays as the base case: below `sm` the card is narrow
        enough that fixed tracks would overflow it, and stretching is the right
        behaviour there.

        No vertical gap between rows — each band's bottom edge is the next
        band's top edge, and any gap would break the silhouette back into
        stacked bars.

        The rows are a fixed 56px rather than `flex-1`, and the list centres
        them.

        This card is stretched by the dashboard grid to the height of the
        orders table beside it. With `flex-1` on each row that surplus was
        divided among the five bands, turning a compact cone into a vertical
        stem taller than it was wide. Five fixed rows hold the 280px chart at
        any card height, and `justify-center` on the list puts that block in
        the middle of the space between the title and the footer.
      */}
      <ol className="mt-5 flex flex-1 flex-col justify-center">
        {BANDS.map((band) => (
          <li
            key={band.label}
            className="grid h-14 shrink-0 grid-cols-[9fr_11fr] items-center gap-3 sm:grid-cols-[minmax(11rem,14rem)_9rem] sm:justify-center sm:gap-4"
          >
            {/* Decorative: the figure in the same row is the same stage, so
                announcing the shape as well would read the funnel out twice.
                The row is 56px and the viewBox is 56 tall, so `none` scales
                only horizontally and the leader keeps a true 1px rule. */}
            <svg
              aria-hidden
              viewBox={`0 0 ${BAND_WIDTH} ${BAND_HEIGHT}`}
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              <path d={band.d} fill={`var(${band.fill})`} />
              {/* Drawn from the band's own edge at half height, so it touches
                  the shape instead of floating in the gutter beside it. */}
              <line
                x1={band.midEdge}
                y1={BAND_HEIGHT / 2}
                x2={BAND_WIDTH}
                y2={BAND_HEIGHT / 2}
                stroke="var(--color-border-strong)"
                strokeWidth={1}
              />
            </svg>

            {/* Name first, figure under it.

                The figure used to lead, which read as a column of numbers with
                captions — fine when the labels were one word, wrong now they
                name what was counted. The stage is the subject and the count
                is its value, so the stage goes first and the count carries the
                weight underneath. */}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-secondary">
                {band.label}
              </p>
              <p className="mt-1 text-lg leading-none font-semibold text-text-primary tabular-nums">
                {compact.format(band.count)}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {/*
        A rule and two columns, not a panel.

        The tinted container this briefly had made the footer a card inside a
        card — a second surface on a page where every other conclusion is set
        off by a border alone.

        `mt-5`, not `mt-auto`: the list above is `flex-1` and has already taken
        every spare pixel, so an auto margin resolves to zero and leaves the
        rule flush against the funnel. A fixed margin is a gap that holds at
        whatever height the card is stretched to.
      */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-5">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-success/25 bg-success-soft text-success-text">
            <TrendingUp className="size-4.5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold text-text-primary">
              Conversion Rate
            </span>
            <span className="block truncate text-xs text-text-muted">
              Visitor → Customer
            </span>
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span className="block text-xl leading-none font-bold text-text-primary tabular-nums">
            {((LAST.count / TOP) * 100).toFixed(1)}%
          </span>
          <span className="mt-1 block text-meta font-medium text-primary tabular-nums">
            ↑ {CONVERSION_CHANGE}% vs last month
          </span>
        </span>
      </div>
    </Card>
  );
}
