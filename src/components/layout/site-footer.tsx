import Link from "next/link";

import { BrandIcon } from "@/components/ui/brand-icon";
import { Logo } from "@/components/ui/logo";
import { APP_ROUTES, footerNav, footerSocials } from "@/constants";
import { siteConfig } from "@/config/site";

/**
 * The three columns the footer shows, and which links from each.
 *
 * `footerNav` stays the full list — it is the site's own inventory of these
 * destinations, Legal included, and nothing is deleted from it. This is the
 * footer's *selection* from it: three groups of five. Twenty-nine links over
 * four columns made the panel a directory; fifteen over three makes it a
 * footer, and the reference works precisely because it is not crowded.
 *
 * Picked by title rather than by index, so the choices read as decisions
 * instead of offsets. Rename a link in `footerNav` and it drops out of the
 * footer rather than quietly pointing somewhere else — the better failure.
 */
const COLUMN_PICKS = {
  Product: [
    "Features",
    "WhatsApp Automation",
    "Campaigns",
    "CRM & Leads",
    "Automation Builder",
  ],
  Solutions: [
    "Small & Medium Business",
    "E-commerce",
    "Marketing Agencies",
    "Real Estate",
    "Education",
  ],
  Resources: [
    "Documentation",
    "Help Center",
    "Blog",
    "Guides",
    "API Documentation",
  ],
} as const;

const pick = (columnTitle: string, itemTitles: readonly string[]) => {
  const source = footerNav.find((column) => column.title === columnTitle);
  return itemTitles
    .map((title) => source?.items.find((item) => item.title === title))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
};

const COLUMNS = Object.entries(COLUMN_PICKS).map(([title, items]) => ({
  title,
  items: pick(title, items),
}));

/**
 * The two legal links that outlive the Legal column, taken from that same
 * column so their routes stay canonical rather than being retyped here.
 */
const LEGAL = pick("Legal", ["Privacy Policy", "Terms of Service"]);

/**
 * How every link on this band behaves: `dark-text` at rest, white on hover,
 * colour only.
 *
 * One constant for both rows, because the bottom row's legal links and the
 * column links are the same kind of thing and were drifting apart — the
 * columns fading colour while the legal pair also slid two pixels sideways.
 * They differ in size, which the call sites set, and in nothing else.
 */
const LINK =
  "text-dark-text transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none";

/**
 * The band's ground: four decorative layers, clipped by the footer's own
 * `overflow-hidden`, none of them in the accessibility tree.
 *
 * 1. `footer-mesh` — the colour, corner by corner. See the utility.
 * 2. Two oversized blurred glows. These are what turn the mesh into
 *    atmosphere: a 60px blur on a shape half the viewport wide has no edge
 *    anywhere, so the light never gives away a boundary. The top-right one is
 *    the reference's signature, and its centre sits *above* the band — which
 *    is the whole difference between light falling on a surface and a pale
 *    disc sitting on one.
 * 3. A scrim, which is the one layer here that is not about colour. It is what
 *    makes the reference's bright top survivable: link ink measures around
 *    3:1 against that top-right light on its own, and 8:1 against the same
 *    light behind this. Anchored in pixels for the reason the mesh is, and
 *    placed after the glows deliberately — ahead of them it would be the one
 *    thing they paint over.
 * 4. `footer-grain` at 3%, so the ramp does not band on an 8-bit display.
 */
function FooterGround() {
  return (
    <>
      <div
        aria-hidden
        className="footer-mesh pointer-events-none absolute inset-0 -z-10"
      />

      {/* The pale light, upper right. The reference's signature. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-72 right-[-8%] -z-10 h-112 w-[55%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.92)_0%,rgba(237,233,254,0.62)_30%,rgba(196,181,253,0.2)_52%,transparent_72%)] opacity-65 blur-[60px]"
      />

      {/* The answering blue-violet, upper left. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-60 left-[-8%] -z-10 h-104 w-[50%] rounded-full bg-[radial-gradient(circle,rgba(91,85,245,0.85)_0%,rgba(109,93,251,0.38)_38%,transparent_72%)] opacity-55 blur-[70px]"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent_0px,rgba(9,13,40,0.2)_40px,rgba(9,13,40,0.58)_150px,rgba(9,13,40,0.78)_320px,rgba(9,13,40,0.9)_520px,rgba(9,13,40,0.93)_100%)]"
      />

      <div
        aria-hidden
        className="footer-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.03] mix-blend-overlay"
      />

      {/* A hairline of light along the top edge, catching the glow. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/22 to-transparent"
      />
    </>
  );
}

/**
 * The bottom of the product: a full-bleed gradient band.
 *
 * The ground runs edge to edge while the content stays in `custom-container`,
 * the same measure every other section on the page uses — so the columns line
 * up with the pricing table and the hero copy above them, and only the colour
 * is full width.
 *
 * `overflow-hidden` is doing real work here: the blurred glows in
 * `FooterGround` are wider than the viewport, and without the clip they would
 * add horizontal scroll to the page. `isolate` keeps their negative z-index
 * stacked against this band rather than against the page.
 *
 * The composition follows the reference: brand and three link columns across
 * the upper half with the light left empty above and beside them, then the
 * small print. The negative space in the top right is doing as much work here
 * as anything set in type, which is why the columns stay left of it.
 */
export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden">
      <FooterGround />

      <div className="custom-container mx-auto px-4 pt-14 pb-6 sm:pt-16 lg:pt-20 lg:pb-8">
        {/*
         * Brand, then three columns: one wide brand cell against three equal
         * link cells from `lg`, going to two columns and then one below it,
         * with the brand always first. That is the reading order the groups
         * are declared in, so the stacked order needs no separate rule.
         */}
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:gap-x-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href={APP_ROUTES.home}
              className="inline-flex items-center rounded-btn focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.35)]"
            >
              <Logo height={32} tone="light" />
            </Link>

            <p className="mt-4 max-w-76 text-[15px] leading-relaxed text-white/76 text-pretty">
              All-in-one digital marketing and WhatsApp automation platform for
              growing businesses, marketers, and agencies.
            </p>

            {/*
             * The social row keeps the brand gradient. It is the one place
             * on this band where the identity ramp appears as a fill, and
             * against navy it reads as the product's own colour rather than
             * as decoration.
             */}
            <div className="mt-6 flex flex-wrap gap-2">
              {footerSocials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="grid size-9 place-items-center rounded-btn border border-white/12 brand-gradient text-white transition-all duration-200 hover:-translate-y-px hover:shadow-[0_10px_22px_-6px_rgba(139,92,246,0.85)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <BrandIcon name={social.icon} className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((column) => (
            <nav
              key={column.title}
              aria-labelledby={`footer-${column.title.toLowerCase()}`}
            >
              <h2
                id={`footer-${column.title.toLowerCase()}`}
                className="text-lg font-semibold tracking-tight text-white capitalize"
              >
                {column.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {column.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={`text-[15px] ${LINK}`}>
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* The small print, and the two legal links the column left behind. */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/12 pt-6 text-sm sm:flex-row lg:mt-16">
          <p className="text-white/70">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <nav className="flex gap-6">
            {LEGAL.map((link) => (
              <Link key={link.href} href={link.href} className={LINK}>
                {link.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
