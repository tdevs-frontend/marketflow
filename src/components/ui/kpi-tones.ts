/**
 * The tint a KPI icon tile can take, shared by both KPI rows.
 *
 * `ui/kpi-strip` (the workspace strip) and `ui/stats-card` (the dashboard and
 * channel rows, which add a trend line) are the same object with and without a
 * comparison, and they used to tint their tiles two different ways: the strip
 * by a named tone, the grid by a `{ soft, text }` pair passed in from the call
 * site. That is how a row of tiles ends up bordered on one page and unbordered
 * on the next. One map, imported by both.
 *
 * The first five are identity colours - the brand and the channel hues - and
 * they exist so a row of four tiles can be told apart at a glance rather than
 * read one label at a time. The last four are *states*: success, warning and
 * danger mean something happened, and spending them on "this card is the
 * digital one" is how a merchant stops trusting green to mean good news.
 */
export type KpiTone =
  | "neutral"
  | "brand"
  | "accent"
  | "email"
  | "sms"
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "x"
  | "info"
  | "success"
  | "warning"
  | "danger";

/**
 * Each tone, as the icon tile it colours.
 *
 * The tile is the only coloured thing on the card - the surface stays white
 * with one neutral border, so a row still reads as a set of one kind of object
 * rather than a set of coloured panels.
 *
 * Every tile is bordered and every border belongs to its own tint. A grey
 * hairline around an amber fill is the mismatch this map exists to prevent:
 * the border is the quiet edge of the same colour, never a second one.
 *
 * Four families ship a border token - `primary`, `email`, `sms`, `whatsapp` -
 * and use it. The rest have no `-border` step, so rather than invent a hex the
 * border is mixed from the family's own solid hue with an alpha. The alphas are
 * measured, not guessed: the four tokened borders sit at 1.33, 1.31, 1.27 and
 * 1.28 against their own fills, so each derived one is tuned to that same ~1.30
 * weight and the whole row reads as one set of tiles.
 *
 *   accent/30  1.31    success/25  1.29    warning/40  1.30
 *   danger/20  1.34    info/20     1.29
 *
 * Note that `info` and `email` are the *same blue* - `--color-info` and
 * `--color-email` are both #2563eb, differing only in how deep their soft is.
 * They are not interchangeable in one row: pick `email` when the thing is the
 * Email channel, `info` when it is a state, and never put both side by side.
 * `whatsapp` and `success` are likewise two different greens, and the same rule
 * applies - the channel green names the channel, the state green means good.
 *
 * The four social platforms are identity tones of the same kind, and they are
 * the reason this map exists rather than four bespoke tiles: a row of platform
 * KPIs has to be told apart at a glance, and the mark alone does not do it at
 * 20px. Their fills come straight from `PLATFORM_THEME.soft` - an 8% wash of
 * the brand hue - so a KPI tile and the same platform's mark in a table row
 * are the same colour. Facebook and LinkedIn are two different blues sitting
 * next to each other by necessity; the marks inside them are what separate
 * them, which is exactly why the icon carries the brand colour rather than the
 * tile carrying all of it.
 */
export const KPI_TONES: Record<KpiTone, string> = {
  neutral: "border-border bg-surface-secondary text-text-muted",
  brand: "border-primary-border bg-primary-soft text-primary",
  accent: "border-accent/30 bg-accent-soft text-accent",
  email: "border-email-border bg-email-soft text-email",
  sms: "border-sms-border bg-sms-soft text-sms",
  whatsapp: "border-whatsapp-border bg-whatsapp-soft text-whatsapp",
  /* No `-border` token behind these four, so the edge is the platform's own
     hue at the ~1.30 weight the tokened families sit at against an 8% fill. */
  instagram: "border-instagram/25 bg-instagram/8 text-instagram",
  facebook: "border-facebook/25 bg-facebook/8 text-facebook",
  linkedin: "border-linkedin/25 bg-linkedin/8 text-linkedin",
  x: "border-x/20 bg-x/6 text-x",
  info: "border-info/20 bg-info-soft text-info-text",
  success: "border-success/25 bg-success-soft text-success-text",
  warning: "border-warning/40 bg-warning-soft text-warning-text",
  danger: "border-error/20 bg-error-soft text-error-text",
};

/**
 * The tile's shape, shared so the two rows cannot drift apart: a 40px square,
 * the panel radius, and a border that every tone above fills in.
 */
export const KPI_TILE = "grid size-10 shrink-0 place-items-center rounded-panel border";
