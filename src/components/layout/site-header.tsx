"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { APP_ROUTES, marketingNav } from "@/constants";
import { cn, isActiveRoute } from "@/lib/utils";

/**
 * The marketing header.
 *
 * A client component only so the nav can read the current route. Everything
 * else here is static, and the two buttons are links, so the cost is one
 * `usePathname` on a bar that is already sticky on every marketing page.
 *
 * The active state is brand ink and nothing else - no rule, no underline. The
 * signal is carried by colour alone, which is why `aria-current` is set:
 * colour is not a cue every reader gets, and the attribute is what tells a
 * screen reader which item is the current page.
 *
 * `isActiveRoute` treats `/` exactly and everything else as a prefix, so Home
 * does not light on `/features` and `/features#crm` does.
 */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur">
      <div className="custom-container mx-auto flex h-18 max-w-6xl items-center justify-between gap-6">
        <Link href={APP_ROUTES.home} className="inline-flex items-center">
          <Logo height={32} priority />
        </Link>

        <nav className="hidden items-center gap-6 text-[15px] md:flex">
          {marketingNav.map((item) => {
            const current = isActiveRoute(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "font-medium transition-colors",
                  /* The resting colour lives here rather than in the base
                     string: `cn()` is a plain join, and `.text-text-secondary`
                     is emitted after `.text-primary`, so a base-level colour
                     would win the cascade against the current page. */
                  current
                    ? "text-primary"
                    : "text-text-secondary hover:text-primary",
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ButtonLink
            href={APP_ROUTES.login}
            variant="ghost"
            size="compact"
            className="border border-border hover:border-border-strong"
          >
            Sign In
          </ButtonLink>
          <ButtonLink href={APP_ROUTES.register} size="compact">
            Start Free
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
