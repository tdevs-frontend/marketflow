import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES, marketingNav } from "@/constants";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4">
        <Link href={APP_ROUTES.home} className="flex items-center gap-2 font-heading text-base font-bold text-text-primary">
          <span className="grid h-8 w-8 place-items-center rounded-btn bg-primary text-sm font-bold text-white">
            M
          </span>
          {siteConfig.name}
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="link-underline font-medium text-text-secondary transition-colors hover:text-primary"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href={APP_ROUTES.login} variant="ghost" size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink href={APP_ROUTES.register} size="sm">
            Start free
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
