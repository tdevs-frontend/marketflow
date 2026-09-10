import Link from "next/link";

import { BrandIcon } from "@/components/ui/brand-icon";
import { Logo } from "@/components/ui/logo";
import { APP_ROUTES, footerNav, footerSocials } from "@/constants";
import { siteConfig } from "@/config/site";

const FOOTER_LINKS = [
  { title: "Privacy Policy", href: APP_ROUTES.features },
  { title: "Terms of Service", href: APP_ROUTES.pricing },
];

/**
 * The footer's ground, and nothing else.
 *
 * Four decorative layers in place of the flat `#1e1b4b` this used to be. The
 * markup above and below them is untouched — same columns, same type, same
 * link behaviour; only what sits behind it changed.
 *
 * 1. `footer-mesh`, the color: six elliptical gradients over an indigo-navy
 *    ramp. See the utility for why they are ellipses and not circles.
 * 2. Two oversized blurred glows. These are what make it read as atmosphere
 *    rather than as a gradient — an 85px blur on a shape half the page wide
 *    has no edge anywhere, so the light never gives away a boundary.
 * 3. A scrim, and the only layer measured in pixels. Everything above it is
 *    sized in per cent of the footer, which is right for color and wrong for
 *    contrast: this element is ~500px tall on a desktop and over 1500px on a
 *    phone, so "bright for the top third" means 170px in one case and 500px
 *    in the other, and on the phone the purple would reach the link columns.
 *    In pixels, the top gets the same light at every width and everything
 *    under it trends to the same navy — which is what the links are read
 *    against. It sits after the glows deliberately; ahead of them it would be
 *    the one thing they paint over.
 * 4. `footer-grain` at 3%, to stop the ramp banding on an 8-bit display.
 *
 * All four are decorative and none is in the accessibility tree. `isolate`
 * keeps them stacked against the footer rather than against the page, and the
 * `overflow-hidden` is what stops the blurred glows spilling onto the section
 * above.
 */
function FooterGround() {
  return (
    <>
      <div
        aria-hidden
        className="footer-mesh pointer-events-none absolute inset-0 -z-10"
      />

      {/* Light arriving from the top right. Its centre sits above the footer,
          so what lands inside is only the falloff — the difference between
          light on a surface and a pale disc on one. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-95 right-[-4%] -z-10 h-130 w-[54%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,rgba(237,233,254,0.6)_26%,rgba(196,181,253,0.24)_48%,transparent_72%)] opacity-60 blur-[85px]"
      />

      {/* The answering purple from the left, cooler and deeper. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-75 left-[-6%] -z-10 h-125 w-[48%] rounded-full bg-[radial-gradient(circle,rgba(124,110,252,0.78)_0%,rgba(109,93,251,0.34)_38%,transparent_72%)] opacity-45 blur-[95px]"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent_0px,rgba(9,13,40,0.14)_40px,rgba(9,13,40,0.52)_150px,rgba(9,13,40,0.74)_330px,rgba(9,13,40,0.88)_560px,rgba(9,13,40,0.92)_100%)]"
      />

      <div
        aria-hidden
        className="footer-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.03] mix-blend-overlay"
      />

      {/* A hairline of light along the top edge, as if catching the glow. It
          replaces the old slate top border, which read as a seam on indigo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/22 to-transparent"
      />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden">
      <FooterGround />

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
                    className="grid h-9 w-9 place-items-center rounded-btn brand-gradient text-white transition-all hover:-translate-y-px hover:shadow-[0_10px_22px_-6px_rgba(139,92,246,0.85)] focus-visible:outline-none focus-visible:shadow-focus"
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
                  className="text-xl font-semibold capitalize text-white"
                >
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-3">
                  {column.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-[15px] text-dark-text transition-colors hover:text-white"
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
        <div className="border-t border-white/10">
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
                  className="transition-colors hover:text-white"
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
