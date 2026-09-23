import { Briefcase } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";
import { APP_ROUTES } from "@/constants";

/**
 * The Solutions hero.
 *
 * `BlogHero`'s band, unchanged: the same `hero-surface` ground, the same 64px
 * grid masked to an ellipse, the same indigo bloom off the top, the same
 * centred column - so a visitor crossing from the home page, Features or the
 * blog lands somewhere that is obviously the same site.
 *
 * The copy names the page the header's Solutions item points at - the
 * industries MarketFlow is sold into - rather than the integration wall it
 * used to head. That wall was the first block on this route and the hero was
 * written for it; the route now opens on the industry grid, and a hero
 * promising integrations above a grid of business types is the page
 * introducing something it does not go on to say.
 *
 * `Briefcase` on the eyebrow rather than `Plug`, matching the icon
 * `marketingNav` already carries for this route.
 *
 * The trail closes the hero rather than opening it, centred on the same axis
 * as the eyebrow and the heading - the arrangement `BlogHero` uses and the
 * reason its `mt-6` is carried across with it. Solutions carries no `href`:
 * it is the page the reader is already on, and a crumb pointing at it is a
 * link that does nothing.
 */
export function SolutionsHero() {
  return (
    <PageHero
      id="solutions"
      eyebrow="MarketFlow Solutions"
      icon={Briefcase}
      title={
        <>
          One platform, shaped around{" "}
          <span className="brand-gradient-text">how your business sells</span>
        </>
      }
      breadcrumb={[
        { label: "Home", href: APP_ROUTES.home },
        { label: "Solutions" },
      ]}
    />
  );
}
