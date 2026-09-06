# MarketFlow Design System

Every value below is a token in `src/styles/variables.css` and reaches components as a
Tailwind utility. Use the token, never the hex.

## The 60-30-10 rule

| Share | Role | Tokens |
| --- | --- | --- |
| 60% | Page ground — white and near-white | `bg-surface`, `bg-background`, `bg-surface-secondary` |
| 30% | Structure — ink, borders, neutral panels | `text-text-primary`, `text-text-secondary`, `border-border`, `border-border-strong` |
| 10% | Brand — spent deliberately | `bg-primary`, `text-primary`, `bg-primary-soft`, `bg-secondary` |

Green is for **primary CTAs, active navigation, key metrics, success states, selected
tabs, brand marks, highlights, charts, and WhatsApp-specific surfaces**. Nothing else.
Never fill a section, a hero, or a page in green.

## Color

**Brand** — `primary` `#128C7E` · `primary-dark` `#075E54` · `primary-darker` `#064C44` (pressed)
· `primary-light` `#25D366` · `primary-soft` `#E8F8F5` · `primary-subtle` `#F1F8F7` (nav hover)
· `primary-soft-hover` `#D7F3EE` (icon-button hover) · `primary-border` `#B7DED8`

`#25D366` is an accent, not a surface. It appears in charts, the live/unread dot, and
highlights — never as a large fill.

**Secondary / accent** — `secondary` `#25D366` · `accent` `#34B7F1` · `accent-soft` `#EAF7FC`

**Neutral** — `background` `#F8FAFC` · `surface` `#FFFFFF` · `surface-secondary` `#F1F5F9`
· `border` `#E2E8F0` · `border-strong` `#CBD5E1` · `text-primary` `#0F172A`
· `text-secondary` `#475569` · `text-muted` `#94A3B8`

**Status** — each pairs a solid with a soft bed and a readable text step:
`success` `#16A34A` / `success-soft` `#DCFCE7` / `success-text` `#15803D` ·
`warning` `#F59E0B` / `warning-soft` `#FEF3C7` / `warning-text` `#B45309` ·
`error` `#DC2626` (hover `#B91C1C`) / `error-soft` `#FEE2E2` / `error-text` `#B91C1C` ·
`info` `#2563EB` / `info-soft` `#DBEAFE` / `info-text` `#1D4ED8`

Status colors are reserved. Never reuse them as a chart series or a decorative tint.

## Typography

Headings **Lexend** (`font-heading`), body **Inter** (`font-sans`), both loaded in
`src/app/layout.tsx`. `h1`–`h6` pick up Lexend, `text-primary` ink, 600 weight and
`-0.02em` tracking from the base layer — no per-heading classes needed.

Weights: 400 regular · 500 medium · 600 semibold · 700 bold.

## Radius, shadow, motion

`rounded-btn` 10px (buttons, inputs, icon chips, nav rows) · `rounded-panel` 12px (panels nested in a card) · `rounded-card` 16px (cards)
· `rounded-full` (pills, avatars, badges).

`shadow-card` `0 4px 20px rgba(15,23,42,.04)` · `shadow-card-hover` `0 10px 30px rgba(15,23,42,.08)`
· `shadow-btn` · `shadow-btn-hover` · `shadow-float` (floating overlays)
· `shadow-focus` `0 0 0 3px rgba(18,140,126,.18)` · `shadow-focus-field` (10% — inputs)
· `shadow-focus-error` (destructive controls).

Shadows stay subtle. Nothing heavier than `shadow-float`.

`--default-transition-duration` is **200ms ease** globally, so every `transition-*`
utility is already on the house timing.

## Components

**Button** (`src/components/ui/button.tsx`) — `rounded-btn`, weight 600, `md` = 12px/20px padding.

| Variant | Rest | Hover | Active |
| --- | --- | --- | --- |
| `primary` | `primary` on white text | `primary-dark`, `-1px` lift, stronger shadow | `primary-darker`, back to `0` |
| `secondary` | white, `primary` text, `primary-border` | `primary-soft` bed, `primary` border, `primary-dark` text | flat |
| `outline` | white, neutral text and border | `surface-secondary`, `border-strong` | flat |
| `ghost` | transparent, `primary` text | `primary-soft` | — |
| `danger` | `error` | `error-hover` | flat |

All focus on `shadow-focus`; `danger` swaps to `shadow-focus-error`.
`IconButton` is the square variant: `primary-soft` / `primary`, hovering to
`primary-soft-hover` / `primary-dark`.

**Card** — `rounded-card`, `border-border`, `bg-surface`, `shadow-card`. Pass `interactive`
for cards that link somewhere: `-2px` lift, `border-strong`, `shadow-card-hover`.

**Input / Textarea / Select** — `rounded-field`, `border-strong`, `text-primary` ink,
`text-muted` placeholder. Focus: `primary` border + `shadow-focus-field`. Pass `error`
to switch the border to `error`, set `aria-invalid`, and use the red focus ring.

**Badge** — `neutral` · `brand` · `success` · `warning` · `danger` · `info`, each a soft
bed with its matching text step.

**Navigation** — active: `primary-soft` bed, `primary-dark` label, `primary` icon and a
`primary` left indicator. Inactive: `text-secondary`. Hover: `primary-subtle` bed,
`primary` label.

**Links** — `primary`, hovering to `primary-dark`. Add `link-underline` for the
left-to-right underline sweep.

## Charts

`chart-1` `#128C7E` (primary series) · `chart-2` `#25D366` (secondary) ·
`chart-3` `#34B7F1` (comparison) · `chart-neutral` `#CBD5E1` · `chart-grid` `#E2E8F0`.

One hue per single-series chart. Three series maximum before you facet. Grid and axes
stay recessive; label the point that matters instead of every point. Never a second
y-axis.

## Landing page

Hero ground is the `hero-surface` utility: `#F8FFFD` under one soft bloom —
`radial-gradient(circle at 70% 30%, rgba(37,211,102,.10), transparent 45%)`. Emphasis
words in a headline take `text-primary-dark` or `text-primary`. Product mockups get a
soft green glow behind them, never a green section.

## Avoid

Excessive green · neon · heavy gradients · heavy glassmorphism · heavy shadows · more
than three chart hues · copying the WhatsApp interface.
