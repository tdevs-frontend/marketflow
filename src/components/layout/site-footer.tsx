import Link from "next/link";

import { BrandIcon } from "@/components/ui/brand-icon";
import { Logo } from "@/components/ui/logo";
import { APP_ROUTES, footerNav, footerSocials } from "@/constants";
import { siteConfig } from "@/config/site";

const FOOTER_LINKS = [
  { title: "Features", href: APP_ROUTES.features },
  { title: "Pricing", href: APP_ROUTES.pricing },
  { title: "Sign in", href: APP_ROUTES.login },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-dark-border bg-[#1e1b4b]">
      <div className="custom-container mx-auto">
        {/* Footer main */}
        <div className="px-4 py-14 sm:py-16">
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] xl:gap-x-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-4 xl:col-span-1">
              <Link href={APP_ROUTES.home} className="inline-flex items-center">
                <Logo height={32} tone="light" />
              </Link>
              <p className="mt-3 max-w-sm text-[15px] text-white/70 text-pretty">
                All-in-one digital marketing and WhatsApp automation platform
                for growing businesses, marketers, and agencies.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {footerSocials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="grid h-9 w-9 place-items-center rounded-btn brand-gradient-accent text-white transition-all hover:-translate-y-px hover:shadow-[0_10px_22px_-6px_rgba(139,92,246,0.85)] focus-visible:outline-none focus-visible:shadow-focus"
                  >
                    <BrandIcon name={social.icon} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {footerNav.map((column) => (
              <nav
                key={column.title}
                aria-labelledby={`footer-${column.title.toLowerCase()}`}
              >
                <h2
                  id={`footer-${column.title.toLowerCase()}`}
                  className="text-base font-semibold uppercase text-white"
                >
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-3">
                  {column.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-[15px] text-dark-text transition-colors hover:text-primary-light"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Footer bottom */}
        <div className="border-t border-dark-border">
          <div className="flex flex-col items-center justify-between gap-4 px-4 py-7 text-sm text-dark-muted sm:flex-row">
            <p>
              © {new Date().getFullYear()} {siteConfig.name}. All rights
              reserved.
            </p>
            <nav className="flex gap-6">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-primary-light"
                >
                  {link.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
