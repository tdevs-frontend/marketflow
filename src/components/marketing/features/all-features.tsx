import {
  BarChart3,
  Megaphone,
  MessageCircle,
  Plug,
  Send,
  ShoppingCart,
  Sparkles,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The whole product, on one screen.
 *
 * Every other section on this page argues for one module in depth, and a
 * visitor who has just read the hero is still asking how much is in here -
 * a question eleven deep sections answer slowly. This one answers it in five
 * seconds: eight groups, one card each, the shape of the platform before any
 * of the detail.
 *
 * Groups, not modules. An earlier cut of this section listed all forty-three
 * named modules from `constants/navigation.dashboardNav`, which answered "how
 * much" and nothing else - forty-three nouns is an inventory, and a prospect
 * scanning an inventory cannot tell which four of them are the reason to buy.
 * Eight groups with a line of description each say what the product *does*,
 * and the sections below are then read as detail on something already
 * understood.
 *
 * Every group is backed by modules that ship. Each card's description names
 * only surfaces that exist in the dashboard today - no roadmap, nothing the
 * sidebar does not route to.
 *
 * The page's opening section, so it sits on the layout's white surface and the
 * tinted `PlatformFlow` below it supplies the first ground change. Grounds
 * alternate down this page - see the note in `features/page.tsx` - and that
 * alternation is what marks the seam between two sections; without it the
 * 80px each spends on padding stack into 160px of flat, unbroken canvas.
 */

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  /**
   * The icon tile. Whole class strings rather than a hue assembled from a
   * name, because Tailwind reads the source for literals and
   * `bg-tint-${hue}-soft` compiles to a tile with no background at all.
   */
  tint: string;
}

/**
 * The eight groups, each wearing the colour its area already has elsewhere in
 * the product.
 *
 * The tints are the `tint-*` family from `styles/variables.css` - the same set
 * the integrations hub paints its icon tiles from - so nothing here is a new
 * palette. The assignment is not decorative: commerce takes Shopify's olive,
 * analytics takes GA4's orange, campaigns take the email blue, multi-channel
 * takes the fuchsia social already wears, and WhatsApp draws from the channel
 * ramp rather than the tint family because there is one WhatsApp green,
 * defined once. A reader who reaches the integrations page or the sidebar
 * meets the same hue next to the same idea.
 *
 * Identity, never state: every bed is a 50-step, a step lighter than the
 * 100-step beds the status badges sit on, so no tile here can be misread as a
 * warning.
 */
const FEATURES: Feature[] = [
  {
    icon: UsersRound,
    title: "Customer Management",
    description:
      "Manage contacts, leads, segments, tags and customer journeys in one place.",
    tint: "bg-tint-cobalt-soft text-tint-cobalt-ink border-tint-cobalt-ink/15",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Automation",
    description:
      "Capture conversations, send personalized messages and automate customer follow-ups.",
    tint: "bg-whatsapp-soft text-whatsapp-dark border-whatsapp-dark/15",
  },
  {
    icon: Megaphone,
    title: "Multi-Channel Marketing",
    description:
      "Create and manage WhatsApp, Email, SMS and Social campaigns from one workspace.",
    tint: "bg-tint-fuchsia-soft text-tint-fuchsia-ink border-tint-fuchsia-ink/15",
  },
  {
    icon: Send,
    title: "Campaign Management",
    description:
      "Build targeted campaigns, manage audiences, templates and campaign activity.",
    tint: "bg-tint-blue-soft text-tint-blue-ink border-tint-blue-ink/15",
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    description:
      "Create automated journeys using triggers, conditions, actions, delays and follow-ups.",
    tint: "bg-tint-indigo-soft text-tint-indigo-ink border-tint-indigo-ink/15",
  },
  {
    icon: ShoppingCart,
    title: "Commerce Management",
    description:
      "Manage products, orders, inventory, catalogs, categories and discounts alongside customer activity.",
    tint: "bg-tint-lime-soft text-tint-lime-ink border-tint-lime-ink/15",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description:
      "Track campaigns, conversations, leads, conversions, orders and revenue.",
    tint: "bg-tint-orange-soft text-tint-orange-ink border-tint-orange-ink/15",
  },
  {
    icon: Plug,
    title: "Integrations",
    description:
      "Connect WhatsApp Business, Email, SMS, Social, Shopify, analytics, Webhooks and API services.",
    tint: "bg-tint-slate-soft text-tint-slate-ink border-tint-slate-ink/15",
  },
];

export function AllFeatures() {
  return (
    <section
      id="all-features"
      aria-labelledby="all-features-title"
      className="section-space-py"
    >
      <div className="custom-container">
        <header className="section-title-space mx-auto max-w-2xl text-center">
          <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-primary-border bg-primary-soft py-1.5 pr-4 pl-3 text-primary">
            <Sparkles className="size-3.5" aria-hidden />
            Our features
          </p>

          <h2
            id="all-features-title"
            className="section-title mt-5 text-balance"
          >
            Everything you need to turn conversations into{" "}
            <span className="brand-gradient-text">growth</span>
          </h2>

          <p className="mt-5 text-base leading-[1.7] text-text-secondary text-pretty">
            Connect customers, conversations, marketing, automation, commerce
            and analytics in one powerful workspace.
          </p>
        </header>

        {/*
         * Four across, two down.
         *
         * Two columns from `sm` and four from `lg`, which is the desktop /
         * tablet / mobile shape the grid is drawn for. `items-stretch` is the
         * grid default and is what keeps a row level: the commerce and
         * integrations descriptions run a line longer than their neighbours,
         * and stretched cards absorb that instead of leaving a ragged floor.
         */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              /*
               * A card, not a KPI tile. No number, no trend chip, no action -
               * nothing on it is interactive, so the only hover is the border
               * warming, which reads as the surface responding rather than as
               * a control that does not exist.
               */
              className="flex flex-col rounded-card border border-border bg-surface p-7 transition-colors hover:border-border-strong"
            >
              <span
                className={cn(
                  "grid size-12 shrink-0 place-items-center rounded-btn border",
                  feature.tint,
                )}
              >
                <feature.icon className="size-6" aria-hidden />
              </span>

              <h3 className="mt-4 text-base sm:text-lg font-bold text-text-primary">
                {feature.title}
              </h3>

              <p className="mt-2.5 text-base leading-[1.6] text-text-muted text-pretty">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
