import {
  ArrowRight,
  BadgeCheck,
  ChartColumnIncreasing,
  CircleCheck,
  Hexagon,
  ShieldCheck,
  UsersRound,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { BrandIcon } from "@/components/ui/brand-icon";
import { CommonTextButton } from "@/components/ui/text-button";
import { APP_ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import { TRUST_STATS } from "./trust-stats";

/**
 * The case for the platform, argued once and then evidenced.
 *
 * Two columns from `lg`: the argument on the left - eyebrow, heading, the three
 * things that make it true, and the one CTA the section exists to land - and
 * the six reasons as cards on the right. The split is what keeps this from
 * reading as a third feature grid: a visitor scanning the right-hand cards is
 * reading detail on a claim the left column has already made, in the same way
 * the Features page's sections are read as detail on `AllFeatures`.
 *
 * It sits after `WhatsAppAutomation` and before `PlatformOverview` - the reader
 * has met the flagship channel, and this is where the page widens from one
 * channel to the argument for the platform, before the ecosystem map spells the
 * whole thing out.
 *
 * Both decorative layers are `pointer-events-none` and behind the content: one
 * soft violet swell along the bottom-left and a dot texture in the opposite
 * corner, masked so it dissolves rather than ending on a line. They are drawn
 * from `primary-soft`, `primary-subtle` and `primary-border`, so the ground is
 * the brand's own lightest rungs rather than a tint mixed for this section.
 *
 * The icon tiles take the `tint-*` family from `styles/variables.css` - the set
 * the integrations hub and `AllFeatures` already paint from, so nothing here is
 * a new palette. WhatsApp is the one exception and draws from the channel ramp,
 * for the same reason it does everywhere else: there is one WhatsApp green.
 * Note that two of the assignments differ from `AllFeatures`, which maps hue to
 * product area (customer management is cobalt there, analytics orange); this
 * section follows its own comp, where the six tiles are chosen to be told apart
 * at a glance in a 3x2 block rather than to match a module's colour elsewhere.
 */

interface Reason {
  /** `null` renders the WhatsApp brand mark instead - see `BrandIcon` below. */
  icon: LucideIcon | null;
  title: string;
  description: string;
  /**
   * The icon tile. Whole class strings rather than a hue assembled from a name,
   * because Tailwind reads the source for literals and `bg-tint-${hue}-soft`
   * compiles to a tile with no background at all.
   */
  tint: string;
  /** Where "Learn more" goes. See the note on `REASONS` below. */
  href: string;
}

/**
 * The six reasons.
 *
 * Every `href` points at a section that exists on the Features page or at a
 * page that ships. `#crm` and `#automation` render today; the rest are anchors
 * the site footer has linked to since before that page existed, and they are
 * used here on the same terms - the anchor is the destination the section will
 * have, not a placeholder. Nothing below links to a route that is not planned.
 */
const REASONS: Reason[] = [
  {
    icon: null,
    title: "Omnichannel Customer Engagement",
    description:
      "Manage WhatsApp, Email, SMS, Social Media and more from a single, unified workspace.",
    tint: "bg-whatsapp-soft text-whatsapp-dark border-whatsapp-dark/15",
    href: "/features#whatsapp",
  },
  {
    icon: Zap,
    title: "Powerful Automation",
    description:
      "Set up automated follow-ups, personalized messages and smart workflows - without any coding.",
    tint: "bg-tint-indigo-soft text-tint-indigo-ink border-tint-indigo-ink/15",
    href: "/features#automation",
  },
  {
    icon: UsersRound,
    title: "Smarter Customer Management",
    description:
      "Keep all your leads, contacts, segments and customer journeys organized in one place.",
    tint: "bg-tint-fuchsia-soft text-tint-fuchsia-ink border-tint-fuchsia-ink/15",
    href: "/features#crm",
  },
  {
    icon: ChartColumnIncreasing,
    title: "Data-Driven Insights",
    description:
      "Track conversations, campaign performance and revenue with real-time analytics.",
    tint: "bg-tint-blue-soft text-tint-blue-ink border-tint-blue-ink/15",
    href: "/features#analytics",
  },
  {
    icon: Hexagon,
    title: "Built for Real Businesses",
    description:
      "Whether you sell products, services or digital goods, MarketFlow adapts to your business needs.",
    tint: "bg-tint-orange-soft text-tint-orange-ink border-tint-orange-ink/15",
    href: "/solutions",
  },
  {
    icon: ShieldCheck,
    title: "Reliable & Secure",
    description:
      "Your data is protected with enterprise-grade security and a platform you can trust.",
    tint: "bg-primary-subtle text-secondary border-secondary/15",
    href: "/features#integrations",
  },
];

const BENEFITS = [
  "All your customer touchpoints in one place",
  "Automation that saves time and drives results",
  "Trusted by growing businesses worldwide",
];

function ReasonCard({ icon: Icon, title, description, tint, href }: Reason) {
  return (
    <article className="group flex h-full flex-col rounded-card border border-border bg-surface p-5 shadow-card transition-[border-color,box-shadow,translate] hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-panel border",
          tint,
        )}
      >
        {Icon ? (
          <Icon className="size-5" aria-hidden />
        ) : (
          <BrandIcon name="whatsapp" className="size-6" />
        )}
      </span>

      <h3 className="mt-5 text-lg leading-snug font-bold text-balance text-text-primary">
        {title}
      </h3>

      <p className="mt-2.5 text-base leading-[1.6] text-text-muted text-pretty">
        {description}
      </p>

      {/*
       * `mt-auto` rather than a fixed gap: the descriptions run two to four
       * lines, and with the grid stretching every card to its row's height the
       * links would otherwise sit at six different heights across a row.
       */}
      <CommonTextButton
        label="Learn more"
        href={href}
        size="sm"
        color="text-text-primary"
        className="mt-auto pt-4"
      />
    </article>
  );
}

/**
 * `ground` is the same vocabulary `FeatureSection` uses, and for the same
 * reason: this section is read on two pages now, and on `/solutions` its
 * neighbour above is the industry grid, which paints its own light grey. Two
 * tinted bands meeting put 160px of unbroken canvas between their content with
 * nothing to say a section ended. The default is the tint, so the home page -
 * where the neighbours are white - is unchanged.
 */
export function WhyChooseUs({
  ground = "tint",
}: {
  ground?: "surface" | "tint";
} = {}) {
  return (
    <section
      aria-labelledby="why-choose-us-title"
      className={cn(
        "section-space-py relative isolate overflow-hidden",
        ground === "tint" && "bg-background",
      )}
    >
      {/* Violet swell, bottom left. Two stops off the brand's lightest rungs,
          fading out before the right edge so it never meets the dots. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 -z-10 h-55 w-[70%] min-w-90 xl:h-60 xl:w-160"
        viewBox="0 0 640 240"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="why-choose-us-swell"
            x1="0"
            y1="0"
            x2="1"
            y2="0.6"
          >
            <stop offset="0%" stopColor="var(--color-primary-soft)" />
            <stop offset="55%" stopColor="var(--color-primary-subtle)" />
            <stop
              offset="100%"
              stopColor="var(--color-primary-subtle)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        <path
          d="M0,30 C60,-8 130,-4 190,26 C260,62 320,92 400,110 C480,128 560,170 640,240 L0,240 Z"
          fill="url(#why-choose-us-swell)"
        />
      </svg>

      {/* Dot texture, bottom right, dissolved into the corner. */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 -bottom-2 -z-10 hidden h-67 w-80 bg-[radial-gradient(var(--color-primary-border)_1.4px,transparent_1.6px)] bg-size-[13px_13px] mask-[radial-gradient(ellipse_at_bottom_right,black_15%,transparent_78%)] lg:block"
      />

      <div className="custom-container-wide">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[minmax(0,0.62fr)_minmax(0,1fr)] xl:gap-14">
          {/* The argument */}
          <div className="max-w-xl">
            <Badge
              as="p"
              variant="primary-outline"
              size="lg"
              casing="none"
              icon={<BadgeCheck aria-hidden />}
            >
              Why choose us
            </Badge>

            <h2
              id="why-choose-us-title"
              className="section-title mt-5 text-balance"
            >
              Built for businesses that{" "}
              <span className="brand-gradient-text">think bigger</span>
            </h2>

            <p className="section-subtitle">
              MarketFlow gives you the tools, automation and insights to turn
              conversations into customers - so you can grow faster, work
              smarter and achieve more.
            </p>

            <ul className="mt-8 space-y-3.5">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3.5">
                  <CircleCheck
                    className="size-6 shrink-0 fill-primary text-white"
                    aria-hidden
                  />
                  <span className="text-base font-medium text-text-primary">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>

            <ButtonLink
              href={APP_ROUTES.register}
              variant="primary"
              size="lg"
              className="mt-10"
            >
              Start Growing
              <ArrowRight aria-hidden />
            </ButtonLink>
          </div>

          {/* The evidence - three across from `xl`, two from `sm`. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {REASONS.map((reason) => (
              <ReasonCard key={reason.title} {...reason} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
