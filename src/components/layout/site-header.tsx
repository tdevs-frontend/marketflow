import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { APP_ROUTES, marketingNav } from "@/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur">
      <div className="custom-container mx-auto flex h-18 max-w-6xl items-center justify-between gap-6">
        <Link href={APP_ROUTES.home} className="inline-flex items-center">
          <Logo height={32} priority />
        </Link>

        <nav className="hidden items-center gap-6 text-[15px] md:flex">
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
          <ButtonLink href={APP_ROUTES.login} variant="ghost" size="compact">
            Sign in
          </ButtonLink>
          <ButtonLink
            href={APP_ROUTES.register}
            variant="gradient"
            size="compact"
          >
            Start free
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
