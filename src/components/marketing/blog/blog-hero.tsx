import { BookOpen } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";
import { APP_ROUTES } from "@/constants";

/**
 * The Resources hero.
 *
 * Same ground, grid and bloom as the Features hero, because a visitor crossing
 * from anywhere else on the site should land somewhere that is obviously the
 * same product. What differs is the promise: this page is not selling, so
 * there is no button pair under the heading - the thing to do next is scroll
 * into the library, and a CTA here would compete with it.
 *
 * The trail is Home › Blog, the same first two crumbs an article carries, so
 * the listing and the pieces in it read as one level of the site.
 */
export function BlogHero() {
  return (
    <PageHero
      id="blog"
      eyebrow="MarketFlow Resources"
      icon={BookOpen}
      title={
        <>
          Insights for better marketing and{" "}
          <span className="brand-gradient-text">customer growth</span>
        </>
      }
      breadcrumb={[
        { label: "Home", href: APP_ROUTES.home },
        { label: "Blog" },
      ]}
    />
  );
}
