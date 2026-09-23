import { MessageCircle } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";
import { APP_ROUTES } from "@/constants";

/**
 * The Contact hero.
 *
 * `BlogHero`'s band, unchanged: the same `hero-surface` ground, the same 64px
 * grid masked to an ellipse, the same indigo bloom off the top, the same
 * centred column and the same trail closing it - so a visitor arriving from
 * the blog, Features or Solutions lands somewhere that is obviously the same
 * site.
 *
 * No button pair under the heading. The thing to do next is on the cards
 * below - a phone number, two addresses and a location - and a CTA here would
 * compete with the very action the page exists for.
 *
 * Contact carries no `href` in the trail: it is the page the reader is
 * already on, and a crumb pointing at it is a link that does nothing.
 */
export function ContactHero() {
  return (
    <PageHero
      id="contact"
      eyebrow="Contact MarketFlow"
      icon={MessageCircle}
      title={
        <>
          Talk to the people who{" "}
          <span className="brand-gradient-text">build it</span>
        </>
      }
      breadcrumb={[
        { label: "Home", href: APP_ROUTES.home },
        { label: "Contact" },
      ]}
    />
  );
}
