import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * The marketing canvas is white, overriding the app-wide `bg-background` that
 * `app/layout.tsx` puts on the body.
 *
 * Stated here rather than by repointing `--color-background`, because that
 * token has a second job: it is the tinted inset surface behind panels in a
 * card, and the ground two of the landing sections paint themselves. Changing
 * it would restyle all of those. Stated here rather than on the body, because
 * the dashboard and auth routes keep the tinted canvas.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
